const express = require("express");
const router = express.Router();
const newrelic = require("newrelic");

const { validateEnglishText } = require("../services/languageToolService");

router.post("/", async (req, res) => {
  try {
    const text = req.body?.text;
    if (!text || String(text).trim().length < 2) {
      return res.status(400).json({ error: "Envie { text } no body." });
    }

    const result = await validateEnglishText(text);
    return res.json(result);
  } catch (err) {
    newrelic.noticeError(err, { endpoint: "/validate" });
    return res.status(500).json({
      error: "Erro ao validar texto",
      detail: process.env.NODE_ENV === "production" ? undefined : String(err?.message || err)
    });
  }
});

module.exports = router;
