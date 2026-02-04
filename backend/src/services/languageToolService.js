const axios = require("axios");

const LT_URL = process.env.LANGUAGETOOL_URL || "https://api.languagetool.org/v2/check";

// Traduções bem certeiras para mensagens comuns (inclui a da sua imagem)
const MESSAGE_MAP = [
  {
    re: /Only proper nouns start with an uppercase character/i,
    pt: "Apenas nomes próprios começam com letra maiúscula (há exceções em títulos)."
  },
  {
    re: /Possible spelling mistake found/i,
    pt: "Possível erro de ortografia encontrado."
  },
  {
    re: /This sentence does not start with an uppercase letter/i,
    pt: "Esta frase não começa com letra maiúscula."
  },
  {
    re: /Did you mean/i,
    pt: "Você quis dizer"
  },
  {
    re: /Repeated word/i,
    pt: "Palavra repetida."
  },
  {
    re: /Missing punctuation/i,
    pt: "Pontuação faltando."
  }
];

function toPtMessage(message) {
  const msg = String(message || "").trim();
  for (const m of MESSAGE_MAP) {
    if (m.re.test(msg)) return m.pt;
  }
  // fallback: mantém a original, mas “embrulha” num PT útil
  return msg
    ? `Sugestão do corretor: ${msg}`
    : "Sugestão do corretor.";
}

function ptCategory(match) {
  const issue = String(match?.rule?.issueType || "").toLowerCase();
  const catId = String(match?.rule?.category?.id || "").toLowerCase();
  const catName = String(match?.rule?.category?.name || "").toLowerCase();

  if (issue.includes("misspelling")) return "Ortografia";
  if (issue.includes("typographical")) return "Digitação";
  if (issue.includes("grammar")) return "Gramática";
  if (issue.includes("style")) return "Estilo";
  if (catId.includes("punct") || catName.includes("punct")) return "Pontuação";
  return "Ajustes gerais";
}

async function validateEnglishText(text) {
  const body = new URLSearchParams();
  body.set("text", String(text || ""));
  body.set("language", "en-US");
  body.set("motherTongue", "pt"); // ajuda um pouco

  const res = await axios.post(LT_URL, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 20000
  });

  const matches = (res.data?.matches || []).map((m) => ({
    ptCategory: ptCategory(m),
    ptMessage: toPtMessage(m.message),
    // mantém original se quiser debug
    message: m.message,
    shortMessage: m.shortMessage,
    replacements: (m.replacements || []).slice(0, 7).map((r) => r.value),
    offset: m.offset,
    length: m.length,
    ruleId: m.rule?.id
  }));

  return {
    ok: matches.length === 0,
    matches
  };
}

module.exports = { validateEnglishText };
