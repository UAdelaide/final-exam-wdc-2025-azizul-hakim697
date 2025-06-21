// routes/userRoutes.js
const express = require('express');
const router = express.Router();

// POST login
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
    req.session.user = {
      id: user.user_id,
      username: user.username,
      role: user.role
    };

    res.json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST register
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

// GET all users (admin/testing)
router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/dogs — Get current owner's dogs
router.get('/dogs', async (req, res) => {
  const db = req.app.locals.db;
  const ownerId = req.session?.user?.id;

  if (!ownerId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [rows] = await db.query(
      `SELECT dog_id, name FROM dogs WHERE owner_id = ?`,
      [ownerId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching dogs:', error.message);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

module.exports = router;
