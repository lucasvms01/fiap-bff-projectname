const axios = require("axios");

function getConfig() {
  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();

  const baseURL =
    process.env.AI_BASE_URL ||
    (provider === "openai" ? "https://api.openai.com/v1" : "https://api.groq.com/openai/v1");

  const apiKey = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.GROQ_API_KEY;

  const model =
    process.env.AI_MODEL || (provider === "openai" ? "gpt-4o-mini" : "llama-3.1-8b-instant");

  if (!apiKey) {
    throw new Error(provider === "openai" ? "OPENAI_API_KEY não configurada" : "GROQ_API_KEY não configurada");
  }

  return { provider, baseURL, apiKey, model };
}

function extractJSONArray(text) {
  const s = String(text || "").trim();

  // tenta JSON puro
  try {
    const direct = JSON.parse(s);
    if (Array.isArray(direct)) return direct;
  } catch (_) {}

  // tenta extrair o primeiro [ ... ]
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    const slice = s.slice(start, end + 1);
    const parsed = JSON.parse(slice);
    if (Array.isArray(parsed)) return parsed;
  }

  throw new Error("Não foi possível extrair um JSON array válido da resposta da IA.");
}

function normalizeOutput(arr, count) {
  if (!Array.isArray(arr)) throw new Error("Resposta não é array.");

  const cleaned = arr
    .map((x) => ({
      word: String(x?.word || "").trim(),
      type: String(x?.type || "").trim(),
      description: String(x?.description || "").trim(), // PT
      useCaseEn: String(x?.useCaseEn || "").trim(), // EN
    }))
    .filter((x) => x.word && x.description && x.useCaseEn);

  // remove duplicadas por word (case-insensitive)
  const uniq = [];
  const seen = new Set();
  for (const it of cleaned) {
    const k = it.word.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(it);
  }

  if (uniq.length < 5) throw new Error("Resposta da IA veio incompleta (poucos itens válidos).");

  return uniq.slice(0, count);
}

function levelPrompt(level) {
  const map = {
    easy: "fácil (A1–A2)",
    medium: "intermediário (B1–B2)",
    hard: "avançado (C1)",
    veryhard: "muito avançado (C2 / vocabulário raro)",
  };
  return map[level] || map.medium;
}

async function askOpenAI({ level = "medium", count = 40, seed = "" } = {}) {
  const { baseURL, apiKey, model } = getConfig();

  const safeCount = Math.max(5, Math.min(Number(count) || 40, 80));
  const levelText = levelPrompt(level);

  // ✅ Seed entra no prompt para "forçar" variação (evita repetir respostas idênticas)
  const prompt = `
SEED DE VARIAÇÃO: ${String(seed).slice(0, 64)}

Gere ${safeCount} palavras em inglês no nível ${levelText}.
Regras IMPORTANTES:
- Evite repetir palavras comuns demais (ex.: very, good, bad, big, small).
- Não repita palavras dentro do próprio resultado.
- A cada chamada, traga palavras diferentes (use a SEED para variar).

Retorne APENAS um JSON válido (sem markdown, sem texto extra) no formato:

[
  {"word":"...","type":"verb|noun|adjective|adverb|phrasal verb","description":"(PT) ...","useCaseEn":"(EN) ..."},
  ...
]

Regras de campos:
- word: apenas a palavra (sem frase)
- type: classe gramatical (verb/noun/adjective/adverb/phrasal verb)
- description: significado/explicação curta em português (1-2 frases)
- useCaseEn: uma frase em inglês usando a palavra (1 frase)
`.trim();

  const response = await axios.post(
    `${baseURL}/chat/completions`,
    {
      model,
      temperature: 0.85, // um pouco mais alto para variar
      messages: [
        {
          role: "system",
          content: "Você é um assistente de ensino de inglês. Responda somente com o JSON solicitado.",
        },
        { role: "user", content: prompt },
      ],
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      timeout: 20000,
    }
  );

  const text = response?.data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Resposta vazia do provedor de IA.");

  const extracted = extractJSONArray(text);
  const data = normalizeOutput(extracted, safeCount);

  return { data, timestamp: new Date().toISOString() };
}

module.exports = { askOpenAI };
