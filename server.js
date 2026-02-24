/* ============================================================
   KASAPOGLU – Backend Server
   Express · Ticket-System · Admin-Dashboard · CSV Export
   ============================================================ */

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// #region agent log
function agentDebugLog(payload) {
  fetch('http://127.0.0.1:7242/ingest/0bc01019-f661-462c-9695-d402f261a73b', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});
}
// #endregion

/* --- Verzeichnisse --- */
const DATA_DIR = path.join(__dirname, 'data');
const CONTACT_FILE = path.join(DATA_DIR, 'contacts.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

[DATA_DIR, UPLOAD_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
if (!fs.existsSync(CONTACT_FILE)) fs.writeFileSync(CONTACT_FILE, '[]', 'utf8');

/* --- Admin Passwort (Hash) ---
   Standard-Passwort: "admin123"
   Bitte ändern: node -e "console.log(require('crypto').createHash('sha256').update('deinpasswort').digest('hex'))" */
const ADMIN_PASSWORD_HASH = crypto.createHash('sha256').update('admin123').digest('hex');

/* --- Multer (Datei-Upload) --- */
const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* --- Rate Limiting --- */
const rateMap = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 10;

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateMap.get(ip) || [];
  const recent = entry.filter(ts => now - ts < WINDOW_MS);
  recent.push(now);
  rateMap.set(ip, recent);

  if (recent.length > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
    });
  }
  next();
}

/* --- Ticket-Nummer generieren --- */
function generateTicket() {
  const year = new Date().getFullYear();
  let contacts = [];
  try {
    contacts = JSON.parse(fs.readFileSync(CONTACT_FILE, 'utf8') || '[]');
  } catch (e) { /* ignore */ }
  const num = String(contacts.length + 1).padStart(5, '0');
  return `KS-${year}-${num}`;
}

/* --- Hilfsfunktion: Kontakte laden --- */
function loadContacts() {
  try {
    return JSON.parse(fs.readFileSync(CONTACT_FILE, 'utf8') || '[]');
  } catch (e) {
    return [];
  }
}

/* --- Hilfsfunktion: Kontakte speichern --- */
function saveContacts(list) {
  fs.writeFileSync(CONTACT_FILE, JSON.stringify(list, null, 2), 'utf8');
}

/* --- Admin Auth Middleware --- */
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token || '';
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  if (hash !== ADMIN_PASSWORD_HASH) {
    return res.status(401).json({ success: false, message: 'Nicht autorisiert.' });
  }
  next();
}

/* --- Middleware --- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use((req, res, next) => {
  if (req.method === 'GET' && (req.path === '/' || req.path === '/schluesselservice.html')) {
    // #region agent log
    agentDebugLog({
      runId: 'render-root',
      hypothesisId: 'H2',
      location: 'server.js:request-middleware',
      message: 'Incoming important GET request',
      data: {
        method: req.method,
        path: req.path,
        host: req.headers.host || null,
        hasIndexHtml: fs.existsSync(path.join(__dirname, 'index.html')),
        hasSchluesselserviceHtml: fs.existsSync(path.join(__dirname, 'schluesselservice.html'))
      },
      timestamp: Date.now()
    });
    // #endregion
  }
  next();
});

/* ============================================================
   PUBLIC API
   ============================================================ */

/* --- Kontakt-Formular --- */
app.post('/api/contact', rateLimit, upload.single('file'), (req, res) => {
  const { name, email, phone, subject, message, privacy, company, captcha, captcha_expected } = req.body;

  // Honeypot
  if (company && company.trim() !== '') {
    return res.status(400).json({ success: false, message: 'Anfrage konnte nicht verarbeitet werden.' });
  }

  // Captcha
  if (!captcha_expected || String(captcha).trim() !== String(captcha_expected).trim()) {
    return res.status(400).json({
      success: false,
      message: 'Sicherheitsfrage falsch.',
      errors: ['Bitte beantworten Sie die Rechenaufgabe korrekt.']
    });
  }

  // Validierung
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Bitte geben Sie einen gültigen Namen ein.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
  if (!subject) errors.push('Bitte wählen Sie einen Betreff.');
  if (!message || message.trim().length < 10) errors.push('Bitte beschreiben Sie Ihr Anliegen genauer (mind. 10 Zeichen).');
  if (!privacy) errors.push('Bitte bestätigen Sie die Datenschutzerklärung.');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Bitte überprüfen Sie Ihre Eingaben.', errors });
  }

  const ticket = generateTicket();

  const entry = {
    id: Date.now().toString(),
    ticket,
    name: name.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : '',
    subject,
    message: message.trim(),
    status: 'neu',
    createdAt: new Date().toISOString(),
    file: req.file ? {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storedAs: req.file.filename
    } : null
  };

  try {
    const list = loadContacts();
    list.push(entry);
    saveContacts(list);
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
    return res.status(500).json({ success: false, message: 'Interner Fehler beim Speichern.' });
  }

  /* PLATZHALTER: E-Mail-Versand
     const nodemailer = require('nodemailer');
     // Kunde informieren mit Ticket-Nummer
     // Admin benachrichtigen über neue Anfrage
  */

  return res.json({
    success: true,
    message: 'Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet.',
    ticket
  });
});

/* ============================================================
   ADMIN API
   ============================================================ */

/* --- Login prüfen --- */
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const hash = crypto.createHash('sha256').update(password || '').digest('hex');
  if (hash === ADMIN_PASSWORD_HASH) {
    return res.json({ success: true, token: password });
  }
  return res.status(401).json({ success: false, message: 'Falsches Passwort.' });
});

/* --- Alle Anfragen abrufen --- */
app.get('/api/admin/contacts', adminAuth, (req, res) => {
  const list = loadContacts();
  // Neueste zuerst
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return res.json({ success: true, contacts: list, total: list.length });
});

/* --- Statistiken --- */
app.get('/api/admin/stats', adminAuth, (req, res) => {
  const list = loadContacts();
  const now = new Date();
  const thisMonth = list.filter(c => {
    const d = new Date(c.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const byStatus = {};
  list.forEach(c => {
    byStatus[c.status || 'neu'] = (byStatus[c.status || 'neu'] || 0) + 1;
  });

  const bySubject = {};
  list.forEach(c => {
    bySubject[c.subject || 'unbekannt'] = (bySubject[c.subject || 'unbekannt'] || 0) + 1;
  });

  return res.json({
    success: true,
    stats: {
      total: list.length,
      thisMonth: thisMonth.length,
      byStatus,
      bySubject
    }
  });
});

/* --- Anfrage-Status aktualisieren --- */
app.patch('/api/admin/contacts/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['neu', 'in_bearbeitung', 'erledigt'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: 'Ungültiger Status.' });
  }

  const list = loadContacts();
  const entry = list.find(c => c.id === id);
  if (!entry) {
    return res.status(404).json({ success: false, message: 'Anfrage nicht gefunden.' });
  }

  entry.status = status;
  entry.updatedAt = new Date().toISOString();
  saveContacts(list);

  return res.json({ success: true, message: 'Status aktualisiert.', contact: entry });
});

/* --- CSV Export --- */
app.get('/api/admin/export', adminAuth, (req, res) => {
  const list = loadContacts();
  const headers = ['Ticket', 'Name', 'E-Mail', 'Telefon', 'Betreff', 'Nachricht', 'Status', 'Erstellt'];
  const rows = list.map(c => [
    c.ticket || '',
    c.name || '',
    c.email || '',
    c.phone || '',
    c.subject || '',
    (c.message || '').replace(/"/g, '""'),
    c.status || 'neu',
    c.createdAt || ''
  ]);

  let csv = headers.join(';') + '\n';
  rows.forEach(row => {
    csv += row.map(v => '"' + v + '"').join(';') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="anfragen.csv"');
  res.send('\uFEFF' + csv); // BOM for Excel
});

/* --- Datei herunterladen (Admin) --- */
app.get('/api/admin/file/:filename', adminAuth, (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Datei nicht gefunden.' });
  }
  res.sendFile(filePath);
});

app.use((req, res, next) => {
  // #region agent log
  agentDebugLog({
    runId: 'render-root',
    hypothesisId: 'H1',
    location: 'server.js:404-fallback',
    message: 'Request reached 404 fallback',
    data: {
      method: req.method,
      path: req.path,
      host: req.headers.host || null
    },
    timestamp: Date.now()
  });
  // #endregion
  next();
});

/* --- Server starten --- */
app.listen(PORT, () => {
  // #region agent log
  agentDebugLog({
    runId: 'render-root',
    hypothesisId: 'H3',
    location: 'server.js:listen-start',
    message: 'Server started with file existence snapshot',
    data: {
      port: PORT,
      cwd: process.cwd(),
      dirname: __dirname,
      hasIndexHtml: fs.existsSync(path.join(__dirname, 'index.html')),
      hasSchluesselserviceHtml: fs.existsSync(path.join(__dirname, 'schluesselservice.html')),
      hasAdminHtml: fs.existsSync(path.join(__dirname, 'admin.html'))
    },
    timestamp: Date.now()
  });
  // #endregion
  console.log(`\n  Kasapoglu Server läuft:`);
  console.log(`  → Website:   http://localhost:${PORT}/schluesselservice.html`);
  console.log(`  → Produkte:  http://localhost:${PORT}/produkte.html`);
  console.log(`  → Admin:     http://localhost:${PORT}/admin.html`);
  console.log(`  → API:       http://localhost:${PORT}/api/contact\n`);
});
