export const validateFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '5242880');
  if (req.file.size > maxSize) {
    return res.status(400).json({ 
      error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB` 
    });
  }

  next();
};

