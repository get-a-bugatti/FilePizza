import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Auto-initialize the uploads directory on boot (mkdir -p, no-op if it exists).
const UPLOADS_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// --- App ---
const app = express();
const upload = multer({ dest: UPLOADS_DIR });

// POST /api/upload — multipart field name: "file"
app.post('/api/upload', upload.single('file'), (req, res) => uploadController.upload(req, res));

// GET /api/download/:id
app.get('/api/download/:id', (req, res) => downloadController.download(req, res));

// JSON error handler (Express 5 forwards rejected async handlers here).
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status ?? err.statusCode ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);
});
