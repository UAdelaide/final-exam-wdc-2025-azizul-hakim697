const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const session = require('express-session'); // ✅ Add this line
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// ✅ Add session middleware here
app.use(session({
  secret: 'dog-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // For dev only (in production use secure: true with HTTPS)
}));

// Global database connection
let db;

(async () => {
  try {
    db = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'dogwalkdb' // Same database as Part 1
    });
    console.log('Connected to dogwalkdb (Part 2)');
    app.locals.db = db; // Make db accessible in routes via req.app.locals.db
  } catch (err) {
    console.error('Failed to connect to database in Part 2:', err);
  }
})();

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app (used by server.js or bin/www)
module.exports = app;
