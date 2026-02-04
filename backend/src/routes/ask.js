const express = require("express");
const router = express.Router();
const newrelic = require("newrelic");

const { askOpenAI } = require("../services/openaiService");

// Cache por level+count (mas só quando count é grande)
// Motivo: quando count é pequeno (ex.: 5), cache faz repetir demais no jogo.
const cacheByKey = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

function daySeed() {
  // muda 1x por dia (para pools grandes não ficarem eternamente iguais)
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

router.get("/", async (req, res) => {
  try {
    const level = String(req.query.level || "medium").toLowerCase();
    const count = Math.max(5, Math.min(Number(req.query.count) || 40, 80));

    // ✅ Regra principal (anti repetição):
    // - count pequeno (<40): NÃO cacheia e usa seed "do momento"
    // - count grande (>=40): cacheia (economiza IA) mas varia por dia (seed diário)
    const SHOULD_CACHE = count >= 40;

    // seed:
    // - se o front enviar seed, respeita
    // - senão: usa seed do momento (para count pequeno) ou do dia (para pool grande)
    const incomingSeed = req.query.seed ? String(req.query.seed) : "";
    const seed = incomingSeed || (SHOULD_CACHE ? daySeed() : String(Date.now()));

    const now = Date.now();
    const key = `${level}:${count}:${seed}`;

    if (SHOULD_CACHE) {
      const cached = cacheByKey.get(key);
      if (cached?.data && now - cached.ts < CACHE_TTL_MS) {
        return res.json(cached.data);
      }
    }

    const result = await askOpenAI({ level, count, seed });

    if (SHOULD_CACHE) {
      cacheByKey.set(key, { ts: now, data: result.data });
    }

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