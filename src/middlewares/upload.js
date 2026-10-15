const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { uploadDir } = require('../config/env');
const ApiError = require('../utils/ApiError');

const dir = path.resolve(uploadDir, 'applications');
fs.mkdirSync(dir, { recursive: true });

const allowed = ['application/pdf', 'image/jpeg', 'image/png'];

module.exports = multer({
  storage: multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) =>
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  fileFilter: (req, file, cb) =>
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new ApiError(400, 'Only PDF, JPG or PNG files are allowed')),
  limits: { fileSize: 5 * 1024 * 1024 },
});