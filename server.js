const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static('.')); // serve index.html + assets

// --- Database setup ---
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const db = new Database(path.join(dataDir, 'bookings.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    ref         TEXT PRIMARY KEY,
    parentName  TEXT NOT NULL,
    phone       TEXT NOT NULL,
    email       TEXT,
    childName   TEXT,
    ticketType  TEXT NOT NULL,
    paymentMethod TEXT NOT NULL,
    amount      INTEGER NOT NULL,
    momoRef     TEXT,
    paid        INTEGER DEFAULT 0,
    createdAt   TEXT DEFAULT (datetime('now'))
  );
`);

// --- Helper: generate booking reference ---
function newRef() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `OAK-2026-${rand}`;
}

// --- Create booking ---
app.post('/api/bookings', (req, res) => {
  const { parentName, phone, email, childName, ticketType, paymentMethod, amount } = req.body;
  if (!parentName || !phone || !ticketType || !paymentMethod || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const ref = newRef();
  db.prepare(`
    INSERT INTO bookings (ref, parentName, phone, email, childName, ticketType, paymentMethod, amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ref, parentName, phone, email || null, childName || null,
         ticketType, paymentMethod, amount);
  res.json({ ref });
});

// --- Confirm payment (store MoMo tx ID) ---
app.post('/api/bookings/:ref/confirm', (req, res) => {
  const { momoRef } = req.body;
  if (!momoRef) return res.status(400).json({ error: 'momoRef required' });

  const info = db.prepare(`
    UPDATE bookings SET momoRef = ?, paid = 1 WHERE ref = ?
  `).run(momoRef, req.params.ref);

  if (info.changes === 0) return res.status(404).json({ error: 'Booking not found' });
  res.json({ ok: true });
});

// --- Lookup booking (for gate verification) ---
app.get('/api/bookings/:ref', (req, res) => {
  const row = db.prepare('SELECT * FROM bookings WHERE ref = ?').get(req.params.ref);
  if (!row) return res.json({ found: false });
  res.json({
    found: true,
    paid: !!row.paid,
    parentName: row.parentName,
    phone: row.phone,
    childName: row.childName,
    typeLabel: row.ticketType === 'child' ? 'Child Participation' : 'Parent / Visitor',
    amount: row.amount,
    momoRef: row.momoRef,
    createdAt: row.createdAt,
  });
});

// --- Admin: list all bookings ---
app.get('/api/bookings', (req, res) => {
  const rows = db.prepare('SELECT * FROM bookings ORDER BY createdAt DESC').all();
  res.json(rows);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Oaklands server running on http://localhost:${PORT}`));