const express = require("express");
const router = express.Router();
const newrelic = require("newrelic");

const { askOpenAI } = require("../services/openaiService");

// Cache simples pra reduzir custo/limite do provedor
let cache = {
  ts: 0,
  data: null
};

const CACHE_TTL_MS = 60 * 1000; // 60s

router.get("/", async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && now - cache.ts < CACHE_TTL_MS) {
      return res.json(cache.data);
    }

    const result = await askOpenAI();

    // result.data já é array validado
    cache = { ts: now, data: result.data };

    res.json(result.data);
  } catch (err) {
    newrelic.noticeError(err, {
      customMessage: "AICommunicationError",
      endpoint: "/ask",
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: "Erro ao consultar o provedor de IA",
      detail: process.env.NODE_ENV === "production" ? undefined : String(err?.message || err)
    });
  }
});

module.exports = router;
