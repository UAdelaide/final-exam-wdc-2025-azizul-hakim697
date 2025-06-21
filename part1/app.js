// app.js
const express = require('express');
const mysql = require('mysql2/promise');
const logger = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
  try {
    // Step 1: Create the database
    const rootConn = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: ''
    });
    await rootConn.query('CREATE DATABASE IF NOT EXISTS dogwalkdb');
    await rootConn.end();

    // Step 2: Connect to the database
    db = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'dogwalkdb'
    });

    // Step 3: Create tables if not exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS dogs (
        dog_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        size VARCHAR(50),
        owner_id INT,
        FOREIGN KEY (owner_id) REFERENCES users(user_id)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS walk_requests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        dog_id INT,
        requested_time DATETIME,
        duration_minutes INT,
        location VARCHAR(255),
        status VARCHAR(50),
        FOREIGN KEY (dog_id) REFERENCES dogs(dog_id)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS walkers (
        walker_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS walks (
        walk_id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT,
        walker_id INT,
        rating INT,
        FOREIGN KEY (request_id) REFERENCES walk_requests(request_id),
        FOREIGN KEY (walker_id) REFERENCES walkers(walker_id)
      );
    `);

    // Step 4: Seed data only if users table is empty
    const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM users');
    if (count === 0) {
      await db.query(`INSERT INTO users (username) VALUES ('alice123'), ('carol123');`);
      await db.query(`INSERT INTO dogs (name, size, owner_id)
        VALUES ('Max', 'medium', 1), ('Bella', 'small', 2);`);
      await db.query(`INSERT INTO walk_requests (dog_id, requested_time, duration_minutes, location, status)
        VALUES (1, '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
               (2, '2025-06-11 10:00:00', 45, 'Central Park', 'closed');`);
      await db.query(`INSERT INTO walkers (username) VALUES ('bobwalker'), ('newwalker');`);
      await db.query(`INSERT INTO walks (request_id, walker_id, rating)
        VALUES (1, 1, 5), (2, 1, 4);`);
    }

    console.log("Database setup complete.");
  } catch (err) {
    console.error('Database error:', err);
  }
})();

// API 1: /api/dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.name AS dog_name, d.size, u.username AS owner_username
      FROM dogs d
      JOIN users u ON d.owner_id = u.user_id;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// API 2: /api/walkrequests/open
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT wr.request_id, d.name AS dog_name, wr.requested_time, wr.duration_minutes, wr.location, u.username AS owner_username
      FROM walk_requests wr
      JOIN dogs d ON wr.dog_id = d.dog_id
      JOIN users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open';
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

// API 3: /api/walkers/summary
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT w.username AS walker_username,
             COUNT(ws.rating) AS total_ratings,
             ROUND(AVG(ws.rating), 1) AS average_rating,
             COUNT(ws.request_id) AS completed_walks
      FROM walkers w
      LEFT JOIN walks ws ON w.walker_id = ws.walker_id
      GROUP BY w.walker_id;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});


app.use(express.static(path.join(__dirname, 'public')));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`DogWalkService API running at http://localhost:${PORT}`);
});

module.exports = app;
