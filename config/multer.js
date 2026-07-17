const multer = require('multer');
const path = require('path');
const fs = require('fs');

// -------- Ensure upload folder exists --------
const uploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// -------- Storage engine --------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // e.g. avatar-1721234567890-384.png
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.fieldname, ext).replace(/[^a-zA-Z0-9]/g, '');
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  }
});

// -------- Only allow common image types --------
const allowedTypes = /jpeg|jpg|png|webp/;
const fileFilter = (req, file, cb) => {
  const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedTypes.test(file.mimetype);

  if (extOk && mimeOk) {
    return cb(null, true);
  }
  cb(new Error('Only .jpg, .jpeg, .png and .webp image files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

module.exports = upload;