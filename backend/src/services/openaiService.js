const AppError = require("../utils/AppError");

async function askOpenAI({ level, count, seed }) {
  const provider = process.env.AI_PROVIDER || "openai";
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const baseUrl =
    process.env.AI_BASE_URL ||
    (provider === "groq"
      ? "https://api.groq.com/openai/v1"
      : "https://api.openai.com/v1");

  const apiKey =
    provider === "groq"
      ? process.env.GROQ_API_KEY
      : process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AppError(
      `API key não configurada para provider "${provider}".`,
      500
    );
  }

  const prompt = `
Gere um ARRAY JSON com ${count} palavras em inglês no nível "${level}".
Seed: ${seed}

Cada item DEVE ter:
{
  "word": "string",
  "type": "noun|verb|adjective|adverb",
  "description": "definição curta em português",
  "useCaseEn": "frase natural em inglês usando a palavra"
}

Retorne SOMENTE o JSON do array.
`;

  const body = {
    model,
    messages: [
      { role: "system", content: "Retorne apenas JSON válido." },
      { role: "user", content: prompt },
    ],
    temperature: 0.9,
  };

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
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
      throw new AppError("Resposta inválida do provedor.", 502);
    }

    if (!res.ok) {
      const msg = data?.error?.message || `Erro HTTP ${res.status}`;
      throw new AppError(`Falha ao consultar ${provider}: ${msg}`, 502);
    }

    const content = data?.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new AppError("O provider não retornou JSON válido.", 502);
    }

    return { data: parsed };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`Erro ao chamar ${provider}.`, 502);
  }
}

module.exports = { askOpenAI };
