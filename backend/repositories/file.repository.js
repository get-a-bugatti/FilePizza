/**
 * File metadata repository (the persistence layer).
 *
 * Records currently live in an in-memory Map. Every read/write of metadata goes
 * through this module, which is the only place that knows *where* records live —
 * swapping in SQLite/Redis for multi-instance deployments means editing this
 * file only; services and controllers stay untouched.
 *
 * A "record" is a plain object describing one uploaded file:
 *   { id, originalName, filename, size, mimetype, createdAt }
 *   e.g. { id: '75c9f52d-...', originalName: 'report.pdf',
 *          filename: '75c9f52d-...__report.pdf', size: 1048576,
 *          mimetype: 'application/pdf', createdAt: '2026-10-13T02:43:23.957Z' }
 */


/* 

      const record = {
            id: fileId,
            originalName: basename(targetFile),
            filename: fileAlias,
            size: 0,
            mimetype: req.headers['content-type'] || 'application/octet-stream',
            createdAt: new Date().toISOString(),
        };
*/


const records = new Map();

export function save(record) {
  records.set(record.id, record);
  return record;
}

export function findById(id) {
  return records.get(id) ?? null;
}

export function findAll() {
  return [...records.values()];
}

export function remove(id) {
  return records.delete(id);
}
