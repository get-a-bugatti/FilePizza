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

const limits = {
  fileSize: 1 * 1024 * 1024 * 1024,
  files: 5
}

export const upload = multer({ storage: storage, limits: limits })