const { validateEnglishText } = require("../services/languageToolService");
const AppError = require("../utils/AppError");
const asyncHandler = require("../middlewares/asyncHandler");

const postValidate = asyncHandler(async (req, res) => {
  const text = req.body?.text;

  if (!text || String(text).trim().length < 2) {
    throw new AppError("Envie { text } no body.", 400);
  }

  const result = await validateEnglishText(text);

  if (!result) {
    throw new AppError("Resposta inválida do serviço de validação", 502);
  }

  return res.json(result);
});

module.exports = { postValidate };
