const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      const error = new Error('Avatar must be a JPEG, PNG, or WebP image');
      error.statusCode = 400;
      return callback(error);
    }
    callback(null, true);
  },
});

const uploadAvatar = (req, res, next) => {
  upload.single('avatar')(req, res, (error) => {
    if (!error) return next();
    res.status(error.statusCode || (error instanceof multer.MulterError ? 400 : 500));
    next(error);
  });
};

module.exports = uploadAvatar;
