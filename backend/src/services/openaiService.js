const AppError = require("../utils/AppError");

function extractJsonArray(text) {
  if (!text) return null;

  // remove fences de markdown caso existam
  const cleaned = String(text)
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  // 1) tenta parse direto (caso já seja JSON puro)
  try {
    const direct = JSON.parse(cleaned);
    if (Array.isArray(direct)) return direct;
  } catch (_) {}

  // 2) tenta extrair o primeiro array [ ... ] dentro do texto
  const first = cleaned.indexOf("[");
  const last = cleaned.lastIndexOf("]");
  if (first >= 0 && last > first) {
    const slice = cleaned.slice(first, last + 1);
    try {
      const parsed = JSON.parse(slice);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
  }

  return null;
}

async function askOpenAI({ level, count, seed }) {
  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();
  const model = process.env.AI_MODEL || "llama-3.1-70b-versatile"; // mantém seu padrão se já usa outro
  const baseUrl =
    process.env.AI_BASE_URL ||
    (provider === "groq" ? "https://api.groq.com/openai/v1" : "https://api.openai.com/v1");

  const apiKey = provider === "groq" ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AppError(`API key não configurada para provider "${provider}".`, 500);
  }

  // ✅ Mantém o formato antigo do seu front (não muda)
  const prompt = `
Gere um ARRAY JSON com ${count} palavras em inglês no nível "${level}".
Seed: ${seed}

Cada item DEVE ter EXATAMENTE estes campos:
{
  "word": "string",
  "type": "noun|verb|adjective|adverb",
  "description": "definição curta em português (1 linha)",
  "useCaseEn": "frase em inglês natural usando a palavra"
}

Regras:
- Não repita palavras.
- Retorne SOMENTE o JSON do array, sem markdown, sem texto extra.
`;

  const body = {
    model,
    messages: [
      { role: "system", content: "Retorne apenas JSON válido (um array). Sem texto adicional." },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
  };

  const url = `${String(baseUrl).replace(/\/$/, "")}/chat/completions`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new AppError(`Resposta inválida do provider (${provider}).`, 502, [raw.slice(0, 200)]);
    }

    if (!res.ok) {
      const msg = data?.error?.message || `Erro HTTP ${res.status}`;
      throw new AppError(`Falha ao consultar ${provider}.`, 502, [msg]);
    }

    const content = data?.choices?.[0]?.message?.content;
    const parsedArray = extractJsonArray(content);

    if (!parsedArray) {
      // agora te dá contexto real do que veio, sem quebrar no front “do nada”
      throw new AppError("O provider não retornou JSON válido.", 502, [
        "A resposta veio com texto extra ou formato inesperado.",
        String(content || "").slice(0, 200),
      ]);
    }

    // normaliza só pra garantir as chaves que seu front espera
    const normalized = parsedArray.map((it) => ({
      word: it?.word,
      type: it?.type,
      description: it?.description,
      useCaseEn: it?.useCaseEn,
    }));

    return { data: normalized };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`Erro ao chamar ${provider}.`, 502, [String(err?.message || err)]);
  }
}

module.exports = { askOpenAI };
