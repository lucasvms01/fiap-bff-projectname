require("dotenv").config();
require("newrelic");

const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const askRoute = require("./routes/ask");

const app = express();

// Confia em proxy (Render/Netlify etc.)
app.set("trust proxy", 1);

app.use(express.json());

// CORS (se quiser travar depois, troque origin: "*")
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: { error: "Muitas requisições. Tente novamente mais tarde." }
  })
);

// Rotas
app.use("/ask", askRoute);

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BFF rodando na porta ${PORT}`));
