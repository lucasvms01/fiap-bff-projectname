const newrelic = require("newrelic");

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || 500;

  // Log estruturado
  const log = {
    ts: new Date().toISOString(),
    level: statusCode >= 500 ? "error" : "warn",
    msg: "request_error",
    requestId: req.id,
    statusCode,
    method: req.method,
    path: req.originalUrl,
    error: err.message,
    details: err.details,
  };
  console.error(JSON.stringify(log));

  // New Relic
  try {
    newrelic.noticeError(err, { requestId: req.id, statusCode, path: req.originalUrl, method: req.method });
  } catch (_) {}

  return res.status(statusCode).json({
    error: err.message || "Erro interno",
    details: process.env.NODE_ENV === "production" ? undefined : err.details,
    requestId: req.id,
  });
}

module.exports = errorHandler;
