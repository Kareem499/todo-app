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
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      picture TEXT,
      google_access_token TEXT,
      google_refresh_token TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      deadline DATE DEFAULT NULL,
      calendar_event_id TEXT DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`ALTER TABLE todos ADD COLUMN IF NOT EXISTS deadline DATE DEFAULT NULL;`);
  await pool.query(`ALTER TABLE todos ADD COLUMN IF NOT EXISTS calendar_event_id TEXT DEFAULT NULL;`);

  console.log('Database tables ready');
}

// --- JWT ---
const JWT_SECRET = process.env.JWT_SECRET;

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// --- Config ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const IS_LOCAL = !process.env.RAILWAY_ENVIRONMENT_NAME;
const BACKEND_CALLBACK = process.env.BACKEND_CALLBACK ||
  (IS_LOCAL ? 'http://localhost:3000/auth/google/callback'
            : 'https://todo-app-production-e4e4.up.railway.app/auth/google/callback');
const FRONTEND_URL = process.env.FRONTEND_URL ||
  (IS_LOCAL ? 'http://localhost:8081' : 'https://kareem499.github.io/todo-app');

// --- Google Token helpers ---
async function getValidAccessToken(userId) {
  const { rows } = await pool.query(
    'SELECT google_access_token, google_refresh_token FROM users WHERE id = $1', [userId]
  );
  if (!rows[0]?.google_refresh_token) return null;

  // Try current access token first (quick check by attempting a call)
  // Refresh using the refresh token
  try {
    const r = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: rows[0].google_refresh_token,
      grant_type: 'refresh_token',
    });
    const newToken = r.data.access_token;
    await pool.query('UPDATE users SET google_access_token = $1 WHERE id = $2', [newToken, userId]);
    return newToken;
  } catch (e) {
    console.error('Token refresh failed:', e.message);
    return null;
  }
}

// --- Google Calendar helpers ---
async function createCalendarEvent(userId, text, deadline) {
  if (!deadline) return null;
  const token = await getValidAccessToken(userId);
  if (!token) return null;
  try {
    const event = {
      summary: text,
      start: { date: deadline },
      end: { date: deadline },
      reminders: { useDefault: true },
    };
    const r = await axios.post(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      event,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return r.data.id;
  } catch (e) {
    console.error('Calendar create error:', e.message);
    return null;
  }
}

async function updateCalendarEvent(userId, eventId, text, deadline) {
  if (!eventId) return;
  const token = await getValidAccessToken(userId);
  if (!token) return;
  try {
    if (!deadline) {
      // Deadline removed — delete the event
      await axios.delete(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return 'deleted';
    }
    await axios.patch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      { summary: text, start: { date: deadline }, end: { date: deadline } },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (e) {
    console.error('Calendar update error:', e.message);
  }
}

async function deleteCalendarEvent(userId, eventId) {
  if (!eventId) return;
  const token = await getValidAccessToken(userId);
  if (!token) return;
  try {
    await axios.delete(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (e) {
    console.error('Calendar delete error:', e.message);
  }
}

// --- Auth: upsert user + tokens ---
async function upsertUser(id, email, name, picture, accessToken, refreshToken) {
  await pool.query(
    `INSERT INTO users (id, email, name, picture, google_access_token, google_refresh_token)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       email=$2, name=$3, picture=$4,
       google_access_token=$5,
       google_refresh_token=COALESCE($6, users.google_refresh_token)`,
    [id, email, name, picture, accessToken, refreshToken ?? null]
  );
  return { token: signToken(id), user: { id, email, name, picture } };
}

// --- Backend-driven OAuth (web) ---
app.get('/auth/google/start', (req, res) => {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', BACKEND_CALLBACK);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'profile email https://www.googleapis.com/auth/calendar.events');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent'); // ensures refresh_token is returned
  res.redirect(url.toString());
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: BACKEND_CALLBACK,
      grant_type: 'authorization_code',
    });
    const { access_token, refresh_token } = tokenRes.data;
    const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const { id, email, name, picture } = userRes.data;
    const { token } = await upsertUser(id, email, name, picture, access_token, refresh_token);
    const dest = new URL(FRONTEND_URL);
    dest.searchParams.set('jwt', token);
    dest.searchParams.set('user', JSON.stringify({ id, email, name, picture }));
    res.redirect(dest.toString());
  } catch (error) {
    console.error('OAuth callback error:', error.message);
    res.redirect(`${FRONTEND_URL}?error=auth_failed`);
  }
});

// Native: access token flow
app.post('/api/auth/google/token', async (req, res) => {
  try {
    const { accessToken } = req.body;
    const userRes = await axios.get('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { id, email, name, picture } = userRes.data;
    const result = await upsertUser(id, email, name, picture, accessToken, null);
    res.json(result);
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(400).json({ error: 'Authentication failed' });
  }
});

// --- Todos ---
app.get('/api/todos', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at ASC', [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get todos error:', error.message);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

app.post('/api/todos', authenticate, async (req, res) => {
  try {
    const { text, deadline } = req.body;
    // Create calendar event if deadline is set
    const calendarEventId = deadline ? await createCalendarEvent(req.userId, text, deadline) : null;
    const result = await pool.query(
      'INSERT INTO todos (user_id, text, deadline, calendar_event_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, text, deadline ?? null, calendarEventId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create todo error:', error.message);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.patch('/api/todos/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, text, deadline } = req.body;

    // Get current todo state
    const current = await pool.query(
      'SELECT * FROM todos WHERE id = $1 AND user_id = $2', [id, req.userId]
    );
    if (!current.rows[0]) return res.status(404).json({ error: 'Todo not found' });
    const todo = current.rows[0];

    let calendarEventId = todo.calendar_event_id;
    const newText = text ?? todo.text;
    const deadlineChanged = deadline !== undefined;
    const newDeadline = deadlineChanged ? (deadline || null) : todo.deadline;

    // Sync calendar
    if (completed === true && calendarEventId) {
      // Completed → remove from calendar
      await deleteCalendarEvent(req.userId, calendarEventId);
      calendarEventId = null;
    } else if (deadlineChanged) {
      if (calendarEventId) {
        const result = await updateCalendarEvent(req.userId, calendarEventId, newText, newDeadline);
        if (result === 'deleted') calendarEventId = null;
      } else if (newDeadline) {
        // Deadline added for the first time
        calendarEventId = await createCalendarEvent(req.userId, newText, newDeadline);
      }
    } else if (text && calendarEventId) {
      // Text changed, update event title
      await updateCalendarEvent(req.userId, calendarEventId, newText, todo.deadline);
    }

    const result = await pool.query(
      `UPDATE todos SET
        completed = COALESCE($1, completed),
        text = COALESCE($2, text),
        deadline = CASE WHEN $3::text IS NOT NULL THEN $3::date ELSE deadline END,
        calendar_event_id = $4
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [completed ?? null, text ?? null, newDeadline, calendarEventId, id, req.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update todo error:', error.message);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.delete('/api/todos/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const current = await pool.query(
      'SELECT calendar_event_id FROM todos WHERE id = $1 AND user_id = $2', [id, req.userId]
    );
    if (current.rows[0]?.calendar_event_id) {
      await deleteCalendarEvent(req.userId, current.rows[0].calendar_event_id);
    }
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
