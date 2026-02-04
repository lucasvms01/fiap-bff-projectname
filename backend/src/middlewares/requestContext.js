const crypto = require("crypto");

function makeId() {
  try {
    if (crypto.randomUUID) return crypto.randomUUID();
    return crypto.randomBytes(16).toString("hex");
  } catch (_) {
    return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
  }
}

function requestContext(req, res, next) {
  req.id = req.headers["x-request-id"] || makeId();
  res.setHeader("x-request-id", req.id);

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    const log = {
      ts: new Date().toISOString(),
      level: "info",
      msg: "http_request",
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };

    console.log(JSON.stringify(log));
  });

  next();
}

module.exports = requestContext;
