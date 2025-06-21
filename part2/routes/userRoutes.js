// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (optional for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (registration)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES (?, ?, ?, ?)`,
      [username, email, password, role]
    );

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST login using username and password
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      `SELECT user_id, username, role FROM users
       WHERE username = ? AND password_hash = ?`,
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user: rows[0] });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});


// Optional route to get session user info
router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

module.exports = router;
