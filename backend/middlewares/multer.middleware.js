import { ALLOWED_MIME_TYPES, UPLOADS_DIR, maxFileCount, maxFileMb } from '../constants.js';
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";
import { AppError, BadRequestError } from '../utils/errorHandlers.js';

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

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Invalid File type.", {code: 'INVALID_FILE_TYPE'}), false);
  }
}



const limits = {
  fileSize: maxFileMb * 1024 * 1024,
  files: maxFileCount,
  fields: 0 // Max number of non-file fields
}

const uploadInstance = multer({ storage: storage, limits: limits, fileFilter: fileFilter });

// Safe wrapper middleware to catch multer errors (e.g., misisng multipart headers, empty/invalid forms)
export const uploadFiles = (fieldName, maxCount) => {
  const middleware = uploadInstance.array(fieldName, maxCount);

  return async (req, res, next) => {

    try {
      await new Promise((resolve, reject) => {

        middleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      next();
   } catch (err) {
      let errorMessage = err.message;
      let errorField = fieldName;

      // Translate native Multer errors into clean, precise developer/client messages
      if (err instanceof multer.MulterError) {
        console.log("MulterErr :", err);
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          errorField = err.field || "unknown_field";
          errorMessage = `Unexpected field name "${errorField}". Files must be uploaded under the "${fieldName}" field.`;
        } else if (err.code === "LIMIT_FILE_COUNT") {
          errorMessage = `Too many files uploaded. Maximum allowed is ${maxCount}.`;
        } else if (err.code === "LIMIT_FILE_SIZE") {
          errorMessage = `File size exceeds the limit of ${maxFileMb}MB.`;
        }

        if (err.code === 'INVALID_FILE_TYPE') {
          errorMessage="Filetype not permitted.";
        }

        return next(
          new BadRequestError(errorMessage || "File Upload error.")
        );
      }
      
      // General format error (e.g. not multipart/form-data)
      return next(
        new BadRequestError("Invalid upload request format. Must be multipart/form-data")
      );
    }
  }
}