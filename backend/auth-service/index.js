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

// Change Password
app.post('/auth/change-password', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) return res.sendStatus(403);

        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current and new password are required" });
        }

        try {
            // Get user's current hash
            const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
            if (result.rows.length === 0) return res.sendStatus(404);

            const userRecord = result.rows[0];

            // Verify current password
            const valid = await bcrypt.compare(currentPassword, userRecord.password_hash);
            if (!valid) {
                return res.status(401).json({ error: "Incorrect current password" });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash(newPassword, salt);

            // Update DB
            await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);

            res.json({ message: "Password updated successfully" });
        } catch (dbErr) {
            console.error("Change Password Error:", dbErr);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });
});

// --- Admin Routes ---

// Middleware to check for Admin Role
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error("JWT Verify Error:", err);
            return res.sendStatus(403);
        }
        console.log("Admin Check:", user.username, user.role);
        if (user.role !== 'admin') {
            console.error("Access Denied: Role is", user.role);
            return res.status(403).json({ error: "Admin access required" });
        }
        req.user = user;
        next();
    });
}

// Get All Users
app.get('/auth/admin/users', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, full_name, role, designation, department, phone, created_at FROM users ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Create User
app.post('/auth/admin/users', authenticateAdmin, async (req, res) => {
    let { email, password, role, full_name, phone, designation, department } = req.body;
    if (!email || !role) {
        return res.status(400).json({ error: "Email and role are required" });
    }

    try {
        // Derive username from email (before @)
        const username = email.split('@')[0];

        // Check if username or email exists
        const check = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (check.rows.length > 0) {
            return res.status(409).json({ error: "Username or Email already exists" });
        }

        let generatedPassword = null;
        if (!password) {
            generatedPassword = Math.random().toString(36).slice(-8); // Simple random string
            password = generatedPassword;
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            `INSERT INTO users (username, password_hash, role, email, full_name, phone, designation, department) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING id, username, email, full_name, role`,
            [username, hash, role, email, full_name, phone, designation, department]
        );

        // Return the password if it was generated so Admin can see it
        const responseData = { ...result.rows[0] };
        if (generatedPassword) {
            responseData.tempPassword = generatedPassword;
        }

        res.status(201).json(responseData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update User
app.put('/auth/admin/users/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { role, full_name, phone, designation, department } = req.body;

    try {
        const result = await pool.query(
            `UPDATE users 
             SET role = COALESCE($1, role), 
                 full_name = COALESCE($2, full_name), 
                 phone = COALESCE($3, phone), 
                 designation = COALESCE($4, designation), 
                 department = COALESCE($5, department)
             WHERE id = $6
             RETURNING id, username, email, full_name, role, designation, department, phone`,
            [role, full_name, phone, designation, department, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Reset Password
app.post('/auth/admin/users/:id/reset-password', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    // In a real app, we might email this temporary password. Here we return it.
    const tempPassword = Math.random().toString(36).slice(-8);

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(tempPassword, salt);

        const result = await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username', [hash, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // TODO: Send email
        console.log(`Password reset for user ${result.rows[0].username} to: ${tempPassword}`);

        res.json({ message: "Password reset successful", tempPassword });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// Seed & Migrate Data
async function ensureSchemaAndSeed() {
    try {
        console.log("Checking DB schema...");

        // 1. Ensure basics
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) NOT NULL,
                email VARCHAR(100) UNIQUE,
                full_name VARCHAR(100),
                phone VARCHAR(20),
                designation VARCHAR(50),
                department VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Add columns if missing (Simple Migration)
        const columns = ['email', 'full_name', 'phone', 'designation', 'department'];
        for (const col of columns) {
            try {
                await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col} VARCHAR(100)`);
            } catch (ignore) { /* ignore if exists */ }
        }

        // 3. Add created_at if missing (TIMESTAMP)
        try {
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        } catch (ignore) { }

        // 3. Seed if empty
        const check = await pool.query('SELECT count(*) FROM users');
        if (parseInt(check.rows[0].count) === 0) {
            console.log("Seeding verified users...");
            const salt = await bcrypt.genSalt(10);

            // User: alice / user123
            const p1 = await bcrypt.hash('user123', salt);
            await pool.query(
                `INSERT INTO users (username, password_hash, role, email, full_name, designation, department) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                ['alice', p1, 'user', 'alice@devops.com', 'Alice Smith', 'Junior Dev', 'Engineering']
            );

            // DevOps: bob / devops123
            const p2 = await bcrypt.hash('devops123', salt);
            await pool.query(
                `INSERT INTO users (username, password_hash, role, email, full_name, designation, department) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                ['bob', p2, 'devops', 'bob@devops.com', 'Bob Jones', 'DevOps Engineer', 'Operations']
            );

            // Admin: admin / admin123
            const p3 = await bcrypt.hash('admin123', salt);
            await pool.query(
                `INSERT INTO users (username, password_hash, role, email, full_name, designation, department) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                ['admin', p3, 'admin', 'admin@devops.com', 'Admin User', 'System Administrator', 'IT']
            );
            console.log("Seeding complete.");
        }
    } catch (e) {
        console.error("Schema/Seeding error:", e);
    }
}

// Start Server
app.listen(PORT, async () => {
    console.log(`Auth Service running on port ${PORT}`);
    await ensureSchemaAndSeed();
});
