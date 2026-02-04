require("dotenv").config();
require("newrelic");

const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const askRoute = require("./routes/ask");
const validateRoute = require("./routes/validate");

// Se você já criou antes, mantenha esses arquivos:
const AppError = require("./utils/AppError");
const errorHandler = require("./middlewares/errorHandler");

const requestContext = require("./middlewares/requestContext");

const app = express();

// Confia em proxy (Render/Netlify etc.)
app.set("trust proxy", 1);

app.use(express.json());

// Request ID + logger estruturado (JSON)
app.use(requestContext);

// CORS (se quiser travar depois, troque origin: "*")
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "x-request-id"],
  })
);

// Rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: { error: "Muitas requisições. Tente novamente mais tarde." },
  })
);

// Rotas
app.use("/ask", askRoute);
app.use("/validate", validateRoute);

app.get("/health", (req, res) => res.status(200).json({ status: "ok", requestId: req.id }));

// 404 padronizado
app.use((req, res, next) => {
  next(new AppError("Rota não encontrada", 404));
});

// Handler global de erro (por último)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BFF rodando na porta ${PORT}`));

module.exports = app;
