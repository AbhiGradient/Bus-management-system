/**
 * ============================================================
 * File: config/multer.js
 * Purpose: Centralized Multer configuration for file uploads
 * ============================================================
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ============================================================
// Upload Directory
// ============================================================

const uploadDirectory = path.join(
    __dirname,
    "..",
    "public",
    "images",
    "uploads"
);

// Create uploads folder if it doesn't exist
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// ============================================================
// Allowed Image Types
// ============================================================

const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
];

const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
];

// ============================================================
// Storage Engine
// ============================================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {

        const extension = path.extname(file.originalname).toLowerCase();

        const filename =
            file.fieldname +
            "-" +
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            extension;

        cb(null, filename);
    }

});

// ============================================================
// File Filter
// ============================================================

function fileFilter(req, file, cb) {

    const extension = path.extname(file.originalname).toLowerCase();

    const validMime =
        allowedMimeTypes.includes(file.mimetype);

    const validExtension =
        allowedExtensions.includes(extension);

    if (validMime && validExtension) {
        return cb(null, true);
    }

    cb(
        new Error(
            "Only JPG, JPEG, PNG and WEBP image files are allowed."
        ),
        false
    );
}

// ============================================================
// Multer Configuration
// ============================================================

const upload = multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 5 * 1024 * 1024 // 5 MB

    }

});

// ============================================================
// Export
// ============================================================

module.exports = upload;