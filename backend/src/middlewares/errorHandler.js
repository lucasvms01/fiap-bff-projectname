const newrelic = require("newrelic");

function errorHandler(err, req, res, next) {
  // evita “headers already sent”
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || 500;

  // log no console (pode trocar por logger depois)
  console.error("[ERROR]", {
    statusCode,
    path: req.originalUrl,
    method: req.method,
    message: err.message,
    details: err.details,
    stack: err.stack,
  });

  // envia para o New Relic (se estiver configurado)
  try {
    newrelic.noticeError(err, {
      statusCode,
      path: req.originalUrl,
      method: req.method,
    });
  } catch (_) {}

  return res.status(statusCode).json({
    error: err.message || "Erro interno",
    details: process.env.NODE_ENV === "production" ? undefined : err.details,
  });
}

module.exports = errorHandler;
