const { askOpenAI } = require("../services/openaiService");
const AppError = require("../utils/AppError");
const asyncHandler = require("../middlewares/asyncHandler");

// Cache por key
const cacheByKey = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

function daySeed() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const getAsk = asyncHandler(async (req, res) => {
  const level = String(req.query.level || "medium").toLowerCase();
  const count = Math.max(5, Math.min(Number(req.query.count) || 40, 80));

  // anti repetição:
  const SHOULD_CACHE = count >= 40;

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

  if (!result?.data) {
    throw new AppError("Resposta inválida do provedor de IA", 502);
  }

  if (SHOULD_CACHE) {
    cacheByKey.set(key, { ts: now, data: result.data });
  }

  return res.json(result.data);
});

module.exports = { getAsk };
