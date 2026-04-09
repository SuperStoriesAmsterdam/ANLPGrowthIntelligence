/* ── Tiny Express API for persistent storage ──
   Two endpoints: GET /api/state and PUT /api/state
   One PostgreSQL table: dashboard_state
   Serves static files from /public */

const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

/* ── Database ── */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:anlp_secret_2026@db:5432/postgres'
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS dashboard_state (
        id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
        edits JSONB NOT NULL DEFAULT '{}',
        annotations JSONB NOT NULL DEFAULT '{}',
        deleted JSONB NOT NULL DEFAULT '[]',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    /* Ensure default row exists */
    await client.query(`
      INSERT INTO dashboard_state (id) VALUES ('default')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

/* ── Middleware ── */
app.use(express.json({ limit: '5mb' }));
app.use(express.static('public'));

/* ── GET /api/state — load all state ── */
app.get('/api/state', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT edits, annotations, deleted, updated_at FROM dashboard_state WHERE id = $1',
      ['default']
    );
    if (result.rows.length === 0) {
      return res.json({ edits: {}, annotations: {}, deleted: [], updated_at: null });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /api/state error:', err);
    res.status(500).json({ error: 'Failed to load state' });
  }
});

/* ── PUT /api/state — save all state ── */
app.put('/api/state', async (req, res) => {
  try {
    const { edits, annotations, deleted } = req.body;
    await pool.query(
      `UPDATE dashboard_state
       SET edits = $1, annotations = $2, deleted = $3, updated_at = NOW()
       WHERE id = $4`,
      [
        JSON.stringify(edits || {}),
        JSON.stringify(annotations || {}),
        JSON.stringify(deleted || []),
        'default'
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/state error:', err);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

/* ── Start with retry ── */
async function startWithRetry(maxRetries = 15, delay = 3000) {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await initDB();
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
      });
      return;
    } catch (err) {
      console.log(`Database not ready (attempt ${i}/${maxRetries}), retrying in ${delay/1000}s...`);
      if (i === maxRetries) {
        console.error('Failed to connect to database after all retries:', err);
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

startWithRetry();
