import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'gym'
});

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, timestamp: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, role, firstName, lastName } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO users (email, password, role, first_name, last_name)
       VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5)
       RETURNING id, email, role, first_name, last_name`,
      [email, password, role, firstName, lastName]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT id, email, role, first_name, last_name
       FROM users
       WHERE email = $1 AND password = crypt($2, password)`,
      [email, password]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// User routes
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, first_name, last_name, profile_image_url
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Video routes
app.get('/api/videos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, u.first_name, u.last_name
       FROM videos v
       JOIN users u ON v.instructor_id = u.id
       ORDER BY v.created_at DESC`
    );
    res.json({ success: true, videos: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/videos', async (req, res) => {
  const { title, description, url, instructorId, duration, category, tags } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO videos (title, description, url, instructor_id, duration, category, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description, url, instructorId, duration, category, tags]
    );
    res.json({ success: true, video: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Training session routes
app.get('/api/sessions/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ts.*, 
              i.first_name as instructor_first_name,
              i.last_name as instructor_last_name,
              c.first_name as client_first_name,
              c.last_name as client_last_name
       FROM training_sessions ts
       JOIN users i ON ts.instructor_id = i.id
       JOIN users c ON ts.client_id = c.id
       WHERE ts.instructor_id = $1 OR ts.client_id = $1
       ORDER BY ts.start_time DESC`,
      [req.params.userId]
    );
    res.json({ success: true, sessions: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  const { instructorId, clientId, title, description, startTime, endTime, price } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO training_sessions 
       (instructor_id, client_id, title, description, start_time, end_time, price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [instructorId, clientId, title, description, startTime, endTime, price]
    );
    res.json({ success: true, session: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Progress routes
app.get('/api/progress/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM progress_records
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.params.userId]
    );
    res.json({ success: true, progress: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/progress', async (req, res) => {
  const { userId, type, value, unit, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO progress_records (user_id, type, value, unit, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, value, unit, notes]
    );
    res.json({ success: true, progress: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
