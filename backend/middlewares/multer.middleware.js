import { UPLOADS_DIR, maxFileCount, maxFileMb } from '../constants.js';
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

// Staging area: multer writes each raw multipart part here while the request is
// still streaming in. The controller later zips those parts into UPLOADS_DIR
// (the final location) and deletes them. Keep the two separate — pointing
// `destination` straight at the final folder is what caused the duplicate files.
const STAGING_DIR = path.join(UPLOADS_DIR, "tmp");

// diskStorage does NOT create the destination folder for you (only the legacy
// `dest:` option does), so make sure it exists before the first upload.
fs.mkdirSync(STAGING_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, STAGING_DIR)
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
      if (err) return cb(err)
      cb(null, file.fieldname + '-' + raw.toString('hex'))
    })
  }
})



const limits = {
  fileSize: maxFileMb * 1024 * 1024,
  files: maxFileCount
}

export const upload = multer({ storage: storage, limits: limits })