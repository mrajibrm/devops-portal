require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting (Brute Force Protection)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per windowMs
    message: "Too many login attempts from this IP, please try again after 15 minutes"
});

// Database Connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Secrets
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_prod';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev_refresh_key_change_in_prod';

// --- Routes ---

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'UP' }));

// Login
app.post('/auth/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        // Fetch user from DB
        // NOTE: In production, we'd have a 'users' table in auth_db.
        // For this Demo, we might need to seed it or use hardcoded logic if DB is empty.
        // Let's assume the DB has users.
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate Tokens
        const accessToken = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ accessToken, refreshToken, role: user.role });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Refresh Token
app.post('/auth/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.sendStatus(401);

    jwt.verify(refreshToken, REFRESH_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);

        // Issue new Access Token (Mocking fetching role again for simplicity)
        // In real app, fetch user to get latest role
        const accessToken = jwt.sign(
            { id: user.id, username: user.username, role: 'user' }, // Simplified
            JWT_SECRET,
            { expiresIn: '15m' }
        );
        res.json({ accessToken });
    });
});

// Verify Token (Middleware helper or endpoint)
app.get('/auth/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        res.json({ user });
    });
});

// Seed Data (For Demo - creates generic users if table is empty)
async function seedUsers() {
    try {
        // Ensure table exists (Normally in init.sql, but here for robustness)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) NOT NULL
            );
        `);

        // Check availability
        const check = await pool.query('SELECT count(*) FROM users');
        if (parseInt(check.rows[0].count) === 0) {
            console.log("Seeding verified users...");
            const salt = await bcrypt.genSalt(10);

            // User: alice / user123
            const p1 = await bcrypt.hash('user123', salt);
            await pool.query("INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)", ['alice', p1, 'user']);

            // DevOps: bob / devops123
            const p2 = await bcrypt.hash('devops123', salt);
            await pool.query("INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)", ['bob', p2, 'devops']);

            // Admin: admin / admin123
            const p3 = await bcrypt.hash('admin123', salt);
            await pool.query("INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)", ['admin', p3, 'admin']);
            console.log("Seeding complete.");
        }
    } catch (e) {
        console.error("Seeding error:", e);
    }
}

// Start Server
app.listen(PORT, async () => {
    console.log(`Auth Service running on port ${PORT}`);
    await seedUsers();
});
