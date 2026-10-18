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


export class RecordStore {
  #records = new Map();

  save(record) {
    this.#records.set(record.id, record);
    return record;
  }

  findById(id) {
    return this.#records.get(id) ?? null;
  }

  findAll() {
    return [...this.#records.values()];
  }

  remove(id) {
    return this.#records.delete(id);
  }
}

// Export a single shared instance — controller/service call save()/findById() on it.
export default new RecordStore();   