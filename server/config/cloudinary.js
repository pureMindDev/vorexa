const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Streams a buffer (from multer's memoryStorage) straight to Cloudinary without touching disk.
// resource_type: 'auto' lets one upload path handle images, videos, and raw files (PDFs, docs, etc).
const uploadBuffer = (buffer, { folder, resourceType = 'auto', originalName } = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        // Cloudinary strips extensions from raw/video public_ids by default — keeping the
        // original filename accessible lets the client offer a sane download name later.
        use_filename: true,
        unique_filename: true,
        filename_override: originalName,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

module.exports = { cloudinary, uploadBuffer };
