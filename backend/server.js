const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Database ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      picture TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      deadline DATE DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Add deadline column if it doesn't exist (for existing databases)
  await pool.query(`
    ALTER TABLE todos ADD COLUMN IF NOT EXISTS deadline DATE DEFAULT NULL;
  `);

  console.log('Database tables ready');
}

// --- JWT helpers ---
const JWT_SECRET = process.env.JWT_SECRET;

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// --- Auth ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:19006/auth/callback';

// Used by expo-auth-session flow (access token sent directly)
app.post('/api/auth/google/token', async (req, res) => {
  try {
    const { accessToken } = req.body;

    const userResponse = await axios.get('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { id, email, name, picture } = userResponse.data;

    await pool.query(
      `INSERT INTO users (id, email, name, picture)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET email=$2, name=$3, picture=$4`,
      [id, email, name, picture]
    );

    const token = signToken(id);
    res.json({ token, user: { id, email, name, picture } });
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(400).json({ error: 'Authentication failed' });
  }
});

// Used by auth code flow (kept for compatibility)
app.post('/api/auth/google', async (req, res) => {
  try {
    const { code } = req.body;

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id, email, name, picture } = userResponse.data;

    await pool.query(
      `INSERT INTO users (id, email, name, picture)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET email=$2, name=$3, picture=$4`,
      [id, email, name, picture]
    );

    const token = signToken(id);
    res.json({ token, user: { id, email, name, picture } });
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(400).json({ error: 'Authentication failed' });
  }
});

// --- Todos (all routes protected by JWT) ---

// GET all todos for a user
app.get('/api/todos', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get todos error:', error.message);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// POST create a todo
app.post('/api/todos', authenticate, async (req, res) => {
  try {
    const { text, deadline } = req.body;
    const result = await pool.query(
      'INSERT INTO todos (user_id, text, deadline) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, text, deadline ?? null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create todo error:', error.message);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PATCH update todo (completed, text, and/or deadline)
app.patch('/api/todos/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, text, deadline } = req.body;
    const result = await pool.query(
      `UPDATE todos SET
        completed = COALESCE($1, completed),
        text = COALESCE($2, text),
        deadline = CASE WHEN $3::text IS NOT NULL THEN $3::date ELSE deadline END
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [completed ?? null, text ?? null, deadline ?? null, id, req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Todo not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update todo error:', error.message);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE a todo
app.delete('/api/todos/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM todos WHERE id = $1 AND user_id = $2', [id, req.userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete todo error:', error.message);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// --- Start ---
const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
});
