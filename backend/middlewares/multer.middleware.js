import { PROJECT_ROOT, maxFileCount, maxFileMb } from './constants.js';


const crypto = require('crypto')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `/uploads/${req.headers[x-filename]}`)  // Change filename later.
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
      if (err) return cb(err)
      cb(null, file.fieldname + '-' + raw.toString('hex'))
    })
  }
})

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? path.join(PROJECT_ROOT, "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  console.error("Upload directory does not exist yet.", UPLOADS_DIR);
}


const limits = {
  fileSize: maxFileMb * 1024 * 1024,
  files: maxFileCount
}

export const upload = multer({ storage: storage, limits: limits })