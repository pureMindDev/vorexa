const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Multer file upload errors (oversized file, wrong type, etc.)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'That file is too large.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err.statusCode === 400) {
    return res.status(400).json({ message: err.message });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `That ${field} is already in use` });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Something went wrong on our end',
  });
};

module.exports = errorHandler;
