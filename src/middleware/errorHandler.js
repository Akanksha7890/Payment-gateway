const AppError = require('../utils/AppError');

function errorHandler(error, _req, res, _next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ success: false, error: 'Invalid JSON body.' });
  }

  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((item) => item.message)
      .join(' ');
    return res.status(422).json({ success: false, error: message });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'A record with these details already exists.',
    });
  }

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  if (statusCode >= 500) console.error(error);

  return res.status(statusCode).json({
    success: false,
    error:
      error instanceof AppError
        ? error.message
        : 'An unexpected server error occurred.',
  });
}

module.exports = errorHandler;
