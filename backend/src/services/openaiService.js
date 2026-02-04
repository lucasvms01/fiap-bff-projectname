const AppError = require("../utils/AppError");

async function askOpenAI({ level, count, seed }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "OPENAI_API_KEY não configurada no backend.",
      500,
      ["Configure a variável OPENAI_API_KEY no Render/Local."]
    );
  }

  const prompt = `
Gere um ARRAY JSON com ${count} palavras em inglês no nível "${level}".
Seed: ${seed}

Cada item DEVE ter EXATAMENTE estes campos (nomes iguais):
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
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: "Retorne apenas JSON válido (array). Sem texto adicional." },
      { role: "user", content: prompt },
    ],
    temperature: 0.9,
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
    } catch (_) {
      throw new AppError("OpenAI retornou resposta inválida (não JSON).", 502, [raw.slice(0, 300)]);
    }

    if (!res.ok) {
      const msg = data?.error?.message || `Erro OpenAI HTTP ${res.status}`;
      throw new AppError("Falha ao consultar a OpenAI.", 502, [msg]);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new AppError("OpenAI não retornou conteúdo.", 502, [JSON.stringify(data).slice(0, 300)]);
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (_) {
      throw new AppError("A OpenAI retornou conteúdo que não é JSON válido.", 502, [content.slice(0, 300)]);
    }

    if (!Array.isArray(parsed)) {
      throw new AppError("Formato inválido: esperado array JSON.", 502, [JSON.stringify(parsed).slice(0, 200)]);
    }

    const normalized = parsed.map((it) => ({
      word: it.word,
      type: it.type,
      description: it.description,
      useCaseEn: it.useCaseEn,
    }));

    return { data: normalized };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Erro de rede ao chamar OpenAI.", 502, [String(err?.message || err)]);
  }
}

module.exports = { askOpenAI };
