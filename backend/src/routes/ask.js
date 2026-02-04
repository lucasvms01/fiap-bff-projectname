const express = require("express");
const router = express.Router();
const newrelic = require("newrelic");

const { askOpenAI } = require("../services/openaiService");

// Cache por level+count (deixa bem mais profissional)
const cacheByLevel = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

router.get("/", async (req, res) => {
  try {
    const level = String(req.query.level || "medium").toLowerCase();
    const count = Math.max(5, Math.min(Number(req.query.count) || 40, 80));

    const now = Date.now();
    const key = `${level}:${count}`;
    const cached = cacheByLevel.get(key);

    if (cached?.data && now - cached.ts < CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    const result = await askOpenAI({ level, count });
    cacheByLevel.set(key, { ts: now, data: result.data });

    return res.json(result.data);
  } catch (err) {
    newrelic.noticeError(err, { endpoint: "/ask", timestamp: new Date().toISOString() });
    return res.status(500).json({
      error: "Erro ao consultar o provedor de IA",
      detail: process.env.NODE_ENV === "production" ? undefined : String(err?.message || err),
    });
  }
});

module.exports = router;
