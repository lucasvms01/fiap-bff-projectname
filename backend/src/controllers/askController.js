const { askOpenAI } = require("../services/openaiService");

const cacheByKey = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const SCHEMA_VERSION = "details_v1"; // <- muda isso quando mudar o formato

function daySeed() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * ✅ Ajuste mínimo:
 * - Antes checava pt_definition/pt_use_case/en_example (formato antigo)
 * - Agora aceita o formato atual do app: description/useCaseEn
 * - Mantém compatibilidade com o antigo (se algum provider devolver assim)
 */
function isCompleteItem(it) {
  if (!it) return false;

  const hasBase = !!it.word && !!it.type;

  const hasCurrent =
    typeof it.description === "string" &&
    it.description.trim().length > 0 &&
    typeof it.useCaseEn === "string" &&
    it.useCaseEn.trim().length > 0;

  const hasLegacy =
    typeof it.pt_definition === "string" &&
    it.pt_definition.trim().length > 0 &&
    typeof it.pt_use_case === "string" &&
    it.pt_use_case.trim().length > 0 &&
    typeof it.en_example === "string" &&
    it.en_example.trim().length > 0;

  return hasBase && (hasCurrent || hasLegacy);
}

async function getAsk(req, res, next) {
  try {
    const level = String(req.query.level || "medium").toLowerCase();
    const count = Math.max(5, Math.min(Number(req.query.count) || 40, 80));

    // cache só para pool grande
    const SHOULD_CACHE = count >= 40;

    const incomingSeed = req.query.seed ? String(req.query.seed) : "";
    const seed = incomingSeed || (SHOULD_CACHE ? daySeed() : String(Date.now()));

    const now = Date.now();

    // ✅ inclui a versão para não reaproveitar cache antigo
    const key = `${SCHEMA_VERSION}:${level}:${count}:${seed}`;

    if (SHOULD_CACHE) {
      const cached = cacheByKey.get(key);
      if (cached?.data && now - cached.ts < CACHE_TTL_MS) {
        return res.json(cached.data);
      }
    }

    const result = await askOpenAI({ level, count, seed });

    const list = Array.isArray(result?.data) ? result.data : [];
    const completeEnough = list.length > 0 && list.every(isCompleteItem);

    // ✅ só cacheia se vier COMPLETO
    if (SHOULD_CACHE && completeEnough) {
      cacheByKey.set(key, { ts: now, data: list });
    }

    // se vier incompleto, devolve mesmo assim (pra você ver), mas sem cache
    return res.json(list);
  } catch (err) {
    return next(err);
  }
}

module.exports = { getAsk };
