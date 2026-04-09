/* ── Express API with SQLite for persistent storage ──
   No external database needed. SQLite file lives in /data volume.
   Two endpoints: GET /api/state and PUT /api/state
   Serves static files from /public */

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

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

/* ── File uploads ── */
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_DIR });

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

/* ── POST /api/upload ── */
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const ext = path.extname(req.file.originalname);
    const safeName = req.file.filename + ext;
    const finalPath = path.join(UPLOAD_DIR, safeName);
    fs.renameSync(req.file.path, finalPath);
    console.log('Upload saved:', safeName);
    res.json({ ok: true, filename: req.file.originalname });
  } catch (err) {
    console.error('POST /api/upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

/* ── GET /api/uploads ── */
app.get('/api/uploads', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR).filter(f => !f.startsWith('.'));
    res.json(files);
  } catch (err) {
    res.json([]);
  }
});

/* ── Start ── */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
