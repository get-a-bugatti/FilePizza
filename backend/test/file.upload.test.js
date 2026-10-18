/**
 * End-to-end tests for the file upload service.
 *
 * Run with:  node --test test/
 * (No extra dependencies — uses node:test, global fetch/FormData and a
 * home-grown zip reader in ./helpers/zip.js.)
 *
 * The app is started in-process on an ephemeral port, and UPLOADS_DIR is
 * pointed at a throwaway temp folder *before* the app modules are imported
 * (constants.js reads it at import time, and dotenv never overrides variables
 * that are already set), so tests never touch the real uploads folder.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { isZip, readZip, hasEndOfCentralDirectory } from "./helpers/zip.js";

// Must happen before the dynamic import below.
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "upload-svc-test-"));
process.env.UPLOADS_DIR = path.join(tmpRoot, "uploads");

const { app } = await import("../app.js");

const API_BASE = "/api/v1/files";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}${API_BASE}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

/** POST files to /upload as multipart/form-data. Returns { res, body }. */
async function upload(files) {
  const form = new FormData();
  for (const { name, data } of files) {
    form.append("files", new Blob([data]), name);
  }
  const res = await fetch(`${baseUrl}/upload`, { method: "POST", body: form });
  const body = await res.json().catch(() => null);
  return { res, body };
}

function storedZipPath(id) {
  return path.join(process.env.UPLOADS_DIR, `upload-${id}.zip`);
}

test("upload: returns a fileId and writes a valid, compressed zip of every file", async () => {
  // Highly compressible text so we can assert real compression happened.
  const text = Buffer.from("compress me please ".repeat(400));
  const binary = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
  const files = [
    { name: "notes.txt", data: text },
    { name: "data.bin", data: binary },
    { name: "manifest.json", data: Buffer.from('{"ok":true}') },
  ];

  const { res, body } = await upload(files);
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.match(body.id, UUID_RE, "response carries a UUID fileId");

  const zipPath = storedZipPath(body.id);
  assert.ok(fs.existsSync(zipPath), `zip artifact exists at ${zipPath}`);

  const buf = fs.readFileSync(zipPath);
  assert.ok(isZip(buf), "artifact starts with the PK local-file signature");
  assert.ok(hasEndOfCentralDirectory(buf), "artifact has an end-of-central-directory record");

  const entries = readZip(buf);
  assert.deepEqual(
    entries.map((e) => e.name).sort(),
    files.map((f) => f.name).sort(),
    "zip contains exactly the uploaded filenames"
  );

  for (const { name, data } of files) {
    const entry = entries.find((e) => e.name === name);
    assert.ok(entry.data.equals(data), `contents of ${name} round-trip byte-for-byte`);
  }

  assert.ok(entries.some((e) => e.method === 8), "entries are deflate-compressed, not stored raw");
  const rawTotal = files.reduce((n, f) => n + f.data.length, 0);
  assert.ok(
    buf.length < rawTotal,
    `zip (${buf.length} B) is smaller than the raw payload (${rawTotal} B)`
  );
});

test("download: streams back the exact stored zip for the fileId", async () => {
  const payload = Buffer.from("download round-trip payload ".repeat(50));
  const up = await upload([{ name: "report.txt", data: payload }]);
  assert.equal(up.res.status, 200);

  const res = await fetch(`${baseUrl}/download/${up.body.id}`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "application/octet-stream");
  assert.match(
    res.headers.get("content-disposition"),
    /^attachment; filename="upload-.+\.zip"$/,
    "served as an attachment named after the stored zip"
  );

  const downloaded = Buffer.from(await res.arrayBuffer());
  const onDisk = fs.readFileSync(storedZipPath(up.body.id));
  assert.ok(downloaded.equals(onDisk), "downloaded bytes match the stored artifact exactly");

  const entries = readZip(downloaded);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].name, "report.txt");
  assert.ok(entries[0].data.equals(payload), "downloaded zip still contains the original content");
});

test("upload: single file end-to-end", async () => {
  const data = Buffer.from("just one file");
  const { res, body } = await upload([{ name: "solo.txt", data }]);
  assert.equal(res.status, 200);
  assert.match(body.id, UUID_RE);

  const entries = readZip(fs.readFileSync(storedZipPath(body.id)));
  assert.equal(entries.length, 1);
  assert.equal(entries[0].name, "solo.txt");
  assert.ok(entries[0].data.equals(data));
});

test("upload: cleans up multer staging files afterwards", async () => {
  const { res } = await upload([
    { name: "a.txt", data: Buffer.from("staging check a") },
    { name: "b.txt", data: Buffer.from("staging check b") },
  ]);
  assert.equal(res.status, 200);

  const stagingDir = path.join(process.env.UPLOADS_DIR, "tmp");
  const leftovers = fs.existsSync(stagingDir) ? fs.readdirSync(stagingDir) : [];
  assert.deepEqual(leftovers, [], "uploads/tmp is empty after a successful upload");
});

test("upload: rejects a request with no files", async () => {
  const res = await fetch(`${baseUrl}/upload`, { method: "POST", body: new FormData() });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.success, false);
});

test("download: 404s for an unknown id", async () => {
  const res = await fetch(`${baseUrl}/download/00000000-0000-4000-8000-000000000000`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.success, false);
});
