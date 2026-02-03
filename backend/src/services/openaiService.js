const axios = require("axios");

/**
 * Configuração por ENV:
 * AI_PROVIDER=groq (default) | openai
 *
 * Se AI_PROVIDER=groq:
 *   GROQ_API_KEY=...
 *   AI_BASE_URL=https://api.groq.com/openai/v1
 *   AI_MODEL=llama-3.1-8b-instant (recomendado, leve)
 *
 * Se AI_PROVIDER=openai:
 *   OPENAI_API_KEY=...
 *   AI_BASE_URL=https://api.openai.com/v1
 *   AI_MODEL=gpt-4o-mini (exemplo)
 */

function getConfig() {
  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();

  const baseURL =
    process.env.AI_BASE_URL ||
    (provider === "openai" ? "https://api.openai.com/v1" : "https://api.groq.com/openai/v1");

  const apiKey =
    provider === "openai" ? process.env.OPENAI_API_KEY : process.env.GROQ_API_KEY;

  const model =
    process.env.AI_MODEL ||
    (provider === "openai" ? "gpt-4o-mini" : "llama-3.1-8b-instant");

  if (!apiKey) {
    throw new Error(
      provider === "openai"
        ? "OPENAI_API_KEY não configurada"
        : "GROQ_API_KEY não configurada"
    );
  }

  return { provider, baseURL, apiKey, model };
}

/**
 * Extrai um JSON array de dentro de um texto (fallback quando a IA manda texto junto)
 */
function extractJSONArray(text) {
  const s = String(text || "").trim();

  // tenta parse direto
  try {
    const direct = JSON.parse(s);
    if (Array.isArray(direct)) return direct;
  } catch (_) {}

  // tenta extrair pelo primeiro [ e último ]
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    const slice = s.slice(start, end + 1);
    const parsed = JSON.parse(slice);
    if (Array.isArray(parsed)) return parsed;
  }

  throw new Error("Não foi possível extrair um JSON array válido da resposta da IA.");
}

/**
 * Valida e normaliza formato [{word, description, useCase}]
 */
function normalizeOutput(arr) {
  if (!Array.isArray(arr)) throw new Error("Resposta não é array.");

  const cleaned = arr
    .map((x) => ({
      word: String(x?.word || "").trim(),
      description: String(x?.description || "").trim(),
      useCase: String(x?.useCase || "").trim()
    }))
    .filter((x) => x.word && x.description && x.useCase);

  if (cleaned.length < 3) {
    throw new Error("Resposta da IA veio incompleta (menos de 3 itens válidos).");
  }

  // Limita em 5 para bater com a tarefa
  return cleaned.slice(0, 5);
}

async function askOpenAI() {
  const { baseURL, apiKey, model } = getConfig();

  const prompt = `
Gere 5 palavras em inglês (nível intermediário) e retorne APENAS um JSON válido (sem markdown, sem texto extra) no formato:
[
  {"word":"...","description":"...","useCase":"..."},
  ...
]
Regras:
- word: apenas a palavra (sem frase)
- description: significado/explicação curta em português (1-2 frases)
- useCase: exemplo de frase em inglês usando a palavra (1 frase)
`.trim();

  // Chat Completions (compatível com Groq) :contentReference[oaicite:2]{index=2}
  const response = await axios.post(
    `${baseURL}/chat/completions`,
    {
      model,
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente de ensino de inglês. Responda somente com o JSON solicitado."
        },
        { role: "user", content: prompt }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 20000
    }
  );

  const text = response?.data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("Resposta vazia do provedor de IA.");
  }

  const extracted = extractJSONArray(text);
  const data = normalizeOutput(extracted);

  return {
    data,
    timestamp: new Date().toISOString()
  };
}

module.exports = { askOpenAI };
