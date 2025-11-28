const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database Setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            fullName TEXT
        )`);
    }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/views', express.static('views')); // Serve views directory statically
app.use(session({
    secret: 'heallink-secret-key', // In production, use environment variable
    resave: false,
    saveUninitialized: false
}));

// Routes

// Serve Landing Page (handled by express.static for index.html in public)

// Authentication Middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Login Page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Patient Portal (Protected)
app.get('/patient-portal', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'portal.html'));
});

// API: Register
app.post('/api/register', (req, res) => {
    const { username, password, fullName } = req.body;
    const saltRounds = 10;

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: 'Error hashing password' });
        }
        const sql = 'INSERT INTO users (username, password, fullName) VALUES (?, ?, ?)';
        db.run(sql, [username, hash, fullName], function (err) {
            if (err) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            req.session.user = { id: this.lastID, username, fullName };
            res.json({ success: true, redirect: '/patient-portal' });
        });
    });
});

// API: Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';

    db.get(sql, [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                req.session.user = { id: user.id, username: user.username, fullName: user.fullName };
                res.json({ success: true, redirect: '/patient-portal' });
            } else {
                res.status(401).json({ error: 'Invalid username or password' });
            }
        });
    });
});

// API: Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ success: true, redirect: '/' });
    });
});

// API: Get Current User
app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
