// An error with an HTTP status whose message is safe to show to the user.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Express 4 does not catch rejected promises from async handlers; this forwards them to the error handler.
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const parseId = (value, label = 'id') => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `Invalid ${label}.`);
  }
  return id;
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ message: err.errors?.[0]?.message || 'Invalid data.' });
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: 'That record already exists.' });
  }

  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error(`${req.method} ${req.originalUrl} failed:`, err);
    return res.status(status).json({ message: 'Something went wrong on our side. Please try again.' });
  }
  res.status(status).json({ message: err.message });
};

module.exports = { HttpError, asyncHandler, parseId, errorHandler };
