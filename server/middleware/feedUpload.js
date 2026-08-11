const multer = require('multer');

// Broader than the AI attachment uploader (middleware/upload.js) — Feed posts can carry
// photos, short clips, or a document, not just images/PDFs for Gemini to read.
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB — generous enough for a short class-recap clip

const storage = multer.memoryStorage(); // buffer only exists long enough to stream to Cloudinary

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('That file type is not supported. Try an image, a short video, or a PDF/document.');
    error.statusCode = 400;
    cb(error);
  }
};

const feedUpload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

module.exports = feedUpload;
