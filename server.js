/* ── Express API with SQLite for persistent storage ──
   No external database needed. SQLite file lives in /data volume.
   Two endpoints: GET /api/state and PUT /api/state
   Serves static files from /public */

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || '/data/dashboard.db';

/* ── Database ── */
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS dashboard_state (
    id TEXT PRIMARY KEY DEFAULT 'default',
    edits TEXT NOT NULL DEFAULT '{}',
    annotations TEXT NOT NULL DEFAULT '{}',
    deleted TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

/* Ensure default row exists */
const row = db.prepare('SELECT id FROM dashboard_state WHERE id = ?').get('default');
if (!row) {
  db.prepare('INSERT INTO dashboard_state (id) VALUES (?)').run('default');
}

console.log('SQLite database initialized at', DB_PATH);

/* ── Middleware ── */
app.use(express.json({ limit: '5mb' }));
app.use(express.static('public'));

/* ── GET /api/state ── */
app.get('/api/state', (req, res) => {
  try {
    const row = db.prepare('SELECT edits, annotations, deleted, updated_at FROM dashboard_state WHERE id = ?').get('default');
    if (!row) {
      return res.json({ edits: {}, annotations: {}, deleted: [], updated_at: null });
    }
    res.json({
      edits: JSON.parse(row.edits),
      annotations: JSON.parse(row.annotations),
      deleted: JSON.parse(row.deleted),
      updated_at: row.updated_at
    });
  } catch (err) {
    console.error('GET /api/state error:', err);
    res.status(500).json({ error: 'Failed to load state' });
  }
});

/* ── PUT /api/state ── */
app.put('/api/state', (req, res) => {
  try {
    const { edits, annotations, deleted } = req.body;
    db.prepare(`
      UPDATE dashboard_state
      SET edits = ?, annotations = ?, deleted = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      JSON.stringify(edits || {}),
      JSON.stringify(annotations || {}),
      JSON.stringify(deleted || []),
      'default'
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/state error:', err);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

/* ── Start ── */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
