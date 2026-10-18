/**
 * Minimal, dependency-free ZIP reader used only by tests.
 *
 * It parses the *central directory* (not the local headers) because archiver
 * streams entries and may leave sizes zeroed in local headers, filling them in
 * via data descriptors. The central directory always carries accurate sizes.
 */
import zlib from "node:zlib";

const LOCAL_HEADER_SIG = 0x04034b50; // PK\x03\x04
const CENTRAL_DIR_SIG = 0x02014b50; // PK\x01\x02
const EOCD_SIG = 0x06054b50; // PK\x05\x06

const EOCD_MIN_SIZE = 22; // fixed part of the end-of-central-directory record
const MAX_COMMENT_SIZE = 0xffff; // EOCD may be followed by up to 64KB of comment

/** True if the buffer starts with the ZIP local-file-header signature. */
export function isZip(buffer) {
  return buffer.length >= 4 && buffer.readUInt32LE(0) === LOCAL_HEADER_SIG;
}

/** True if an end-of-central-directory record can be found near the end. */
export function hasEndOfCentralDirectory(buffer) {
  return findEOCD(buffer) !== -1;
}

/**
 * Parse a ZIP buffer and return its entries:
 *   [{ name, data, method, compressedSize, uncompressedSize }]
 * `method` is 0 (stored) or 8 (deflate). Throws on corrupt archives.
 */
export function readZip(buffer) {
  const eocdOffset = findEOCD(buffer);
  if (eocdOffset === -1) throw new Error("Corrupt zip: end-of-central-directory record not found");

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  let offset = buffer.readUInt32LE(eocdOffset + 16); // central directory offset

  const entries = [];
  for (let i = 0; i < entryCount; i++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== CENTRAL_DIR_SIG) {
      throw new Error(`Corrupt zip: bad central directory signature at offset ${offset}`);
    }

    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLen);

    if (buffer.readUInt32LE(localOffset) !== LOCAL_HEADER_SIG) {
      throw new Error(`Corrupt zip: bad local header for "${name}"`);
    }
    const localNameLen = buffer.readUInt16LE(localOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const raw = buffer.subarray(dataStart, dataStart + compressedSize);

    let data;
    if (method === 0) {
      data = Buffer.from(raw);
    } else if (method === 8) {
      data = zlib.inflateRawSync(raw); // throws if the deflate stream is corrupt
    } else {
      throw new Error(`Unsupported compression method ${method} for "${name}"`);
    }

    if (data.length !== uncompressedSize) {
      throw new Error(
        `Corrupt zip: "${name}" decompressed to ${data.length} bytes, expected ${uncompressedSize}`
      );
    }

    entries.push({ name, data, method, compressedSize, uncompressedSize });
    offset += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

function findEOCD(buffer) {
  if (buffer.length < EOCD_MIN_SIZE) return -1;
  const earliest = Math.max(0, buffer.length - EOCD_MIN_SIZE - MAX_COMMENT_SIZE);
  for (let i = buffer.length - EOCD_MIN_SIZE; i >= earliest; i--) {
    if (buffer.readUInt32LE(i) === EOCD_SIG) return i;
  }
  return -1;
}
