const { nodeEnv } = require('../config/env');

exports.notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  if (err.code === '23505') {
    status = 409;
    message = 'Duplicate value: this record already exists';
  } else if (err.code === '23503') {
    status = 409;
    message = 'Referenced record does not exist or is still in use';
  } else if (err.name === 'MulterError') {
    status = 400;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Invalid or expired token';
  }

  if (status >= 500) console.error(err);
  if (status >= 500 && nodeEnv === 'production') message = 'Internal server error';

  res.status(status).json({ message, ...(err.details && { details: err.details }) });
};