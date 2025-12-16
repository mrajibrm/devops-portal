package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"ticket-service/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	_ "github.com/lib/pq"
)

var db *sql.DB
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}
var clients = make(map[*websocket.Conn]bool)
var clientsMutex sync.RWMutex // Mutex to protect clients map
var broadcast = make(chan Message)

type Message struct {
	Type string `json:"type"`
	Data interface{} `json:"data"`
}

type Ticket struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"` // OPEN, IN_PROGRESS, RESOLVED
	Severity    string `json:"severity"` // LOW, MEDIUM, HIGH, CRITICAL
	OwnerID     string `json:"owner_id"`
	CreatedAt   time.Time `json:"created_at"`
}

func main() {
	// Database Connection
	var err error
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"))
	
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	// Initialize Tables
	initDB()

	// Router
	r := gin.Default()
	r.Use(AuthMiddleware()) // simplified global auth

	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "UP"}) })
	
	r.GET("/api/tickets", listTickets)
	r.POST("/api/tickets", createTicket)
	r.PATCH("/api/tickets/:id", updateTicket)
	r.POST("/api/tickets/:id/fetch", fetchExternal)

	// WebSocket
	r.GET("/api/tickets/live", handleWebSocket)

	// Background SLA Monitor
	go monitorSLA()
	// Background WS Broadcaster
	go handleMessages()

	r.Run(":8080")
}

func initDB() {
	query := `
	CREATE TABLE IF NOT EXISTS tickets (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		title VARCHAR(255),
		description TEXT,
		status VARCHAR(50) DEFAULT 'OPEN',
		severity VARCHAR(50) DEFAULT 'LOW',
		owner_id VARCHAR(50),
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);
	`
	_, err := db.Exec(query)
	if err != nil {
		log.Println("Error creating table:", err)
	}
}

// Middleware
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		
		// If no header, check query param (for WebSockets)
		if tokenString == "" {
			tokenString = c.Query("token")
		}

		if tokenString == "" {
			c.AbortWithStatus(401)
			return
		}
		// remove Bearer
		tokenString = strings.Replace(tokenString, "Bearer ", "", 1)

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatus(401)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if ok {
			c.Set("user_id", claims["id"]) // Mock ID
			c.Set("role", claims["role"])
			c.Set("username", claims["username"])
		}
		c.Next()
	}
}

// Handlers
func listTickets(c *gin.Context) {
	// Implement Role-Based filtering here or via RLS in real DB user switching
	rows, err := db.Query("SELECT id, title, description, status, severity, owner_id, created_at FROM tickets ORDER BY created_at DESC")
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var tickets []Ticket
	for rows.Next() {
		var t Ticket
		if err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.Status, &t.Severity, &t.OwnerID, &t.CreatedAt); err != nil {
			continue
		}
		tickets = append(tickets, t)
	}
	c.JSON(200, tickets)
}

func createTicket(c *gin.Context) {
	var t Ticket
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	// Set Owner from Token
	username, _ := c.Get("username")
	t.OwnerID = fmt.Sprintf("%v", username)

	// Use QueryRow to execute INSERT and get back the generated defaults (id, status, created_at)
	// We assume input T might have Title, Description, Severity.
	// We RETURNING all fields to ensure our struct is perfectly synced with DB state.
	err := db.QueryRow(`
		INSERT INTO tickets (title, description, status, severity, owner_id) 
		VALUES ($1, $2, 'OPEN', $3, $4) 
		RETURNING id, title, description, status, severity, owner_id, created_at`, 
		t.Title, t.Description, t.Severity, t.OwnerID).
		Scan(&t.ID, &t.Title, &t.Description, &t.Status, &t.Severity, &t.OwnerID, &t.CreatedAt)
	
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Broadcast FULL ticket object
	broadcast <- Message{Type: "NEW_TICKET", Data: t}
	c.JSON(201, t)
}

func updateTicket(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Update and RETURNING the full row to get the authoritative state
	var t Ticket
	err := db.QueryRow(`
		UPDATE tickets 
		SET status=$1, updated_at=NOW() 
		WHERE id=$2 
		RETURNING id, title, description, status, severity, owner_id, created_at`, 
		input.Status, id).
		Scan(&t.ID, &t.Title, &t.Description, &t.Status, &t.Severity, &t.OwnerID, &t.CreatedAt)

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Audit Log (Simplified)
	
	// Broadcast FULL updated ticket
	broadcast <- Message{Type: "TICKET_UPDATED", Data: t}
	c.JSON(200, t)
}

func fetchExternal(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		URL string `json:"url"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// 1. SSRF Protection
	data, err := utils.FetchExternalData(input.URL)
	if err != nil {
		c.JSON(403, gin.H{"error": "Blocked by Security Policy: " + err.Error()})
		return
	}

	// 2. Attach Note to Ticket and Return Updated Ticket
	note := fmt.Sprintf("External Data Fetch [%s]: %s", input.URL, data)
	
	var t Ticket
	err = db.QueryRow(`
		UPDATE tickets 
		SET description = description || $1, updated_at=NOW() 
		WHERE id=$2 
		RETURNING id, title, description, status, severity, owner_id, created_at`, 
		"\n\n"+note, id).
		Scan(&t.ID, &t.Title, &t.Description, &t.Status, &t.Severity, &t.OwnerID, &t.CreatedAt)

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Broadcast FULL updated ticket
	broadcast <- Message{Type: "TICKET_UPDATED", Data: t}
	
	c.JSON(200, gin.H{"message": "Data fetched and attached", "data": data, "ticket": t})
}

// WebSocket
func handleWebSocket(c *gin.Context) {
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	// Do not defer ws.Close() immediately if we were handling loop differently,
	// but here we block in ReadMessage so it's fine.
	// Properly manage connection lifetime.
	defer func() {
		clientsMutex.Lock()
		delete(clients, ws)
		clientsMutex.Unlock()
		ws.Close()
	}()

	clientsMutex.Lock()
	clients[ws] = true
	clientsMutex.Unlock()

	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			break
		}
	}
}

func handleMessages() {
	for {
		msg := <-broadcast
		clientsMutex.RLock()
		for client := range clients {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("error: %v", err)
				client.Close()
				// We can't delete here safely while iterating with RLock, 
				// but handleWebSocket will clean it up on read error or close.
				// In robust impl, we might collect dead clients and delete later.
			}
		}
		clientsMutex.RUnlock()
	}
}

func monitorSLA() {
	// Periodic check for SLA breaches
	for {
		time.Sleep(1 * time.Minute)
		// Logic to find 'OPEN' tickets older than X hours logic...
	}
}
