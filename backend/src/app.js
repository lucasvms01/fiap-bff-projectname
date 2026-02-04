const express = require("express");
const cors = require("cors");

const askRoute = require("./routes/ask");
const validateRoute = require("./routes/validate");

const AppError = require("./utils/AppError");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/ask", askRoute);
app.use("/validate", validateRoute);

// ✅ 404 padronizado
app.use((req, res, next) => {
  next(new AppError("Rota não encontrada", 404));
});

// ✅ handler global de erros (sempre por último)
app.use(errorHandler);

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend rodando na porta ${port}`));

module.exports = app;
