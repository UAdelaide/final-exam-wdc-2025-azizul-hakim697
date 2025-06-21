// routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Use db from app.locals
router.post('/login', async (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT user_id, username, role FROM users WHERE username = ? AND password_hash = ?',
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    // Respond with user info (no redirect here; handled by frontend)
    res.json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/register', async (req, res) => {
  const db = req.app.locals.db;
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

// Optional: View all users (testing)
router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
