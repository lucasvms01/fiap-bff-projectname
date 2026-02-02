// Importa o pacote dotenv para carregar variáveis de ambiente do arquivo .env
require('dotenv').config();

// Importa o New Relic para monitoramento de performance e erros
require('newrelic');

// Importa o framework Express, que facilita a criação de servidores web em Node.js
const express = require('express');

// Importa o pacote express-rate-limit para limitar o número de requisições a uma rota
const rateLimit = require('express-rate-limit');

// Cria uma instância do Express
const app = express();

// Adiciona um middleware para interpretar requisições com corpo em JSON
app.use(express.json());

// Importa o pacote cors para permitir requisições de diferentes origens
const cors = require('cors');

// Importa o roteador definido em 'routes/ask.js'
const askRoute = require('./routes/ask');

// Adiciona um middleware para interpretar requisições com corpo em JSON
app.use(express.json());

// Adiciona o middleware cors para permitir requisições de diferentes origens
const corsOptions = {
  origin: '*', // Permite todas as origens. Altere para um domínio específico, se necessário.
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
};

// Aplica o middleware CORS com as opções definidas acima
app.use(cors(corsOptions));

// Configura o rate limit para limitar o número de requisições por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Limite de 20 requisições por IP
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
});

// Aplica o rate limit globalmente
app.use(limiter);

// Define a rota '/ask' que utiliza o roteador importado de 'routes/ask.js'
app.use('/ask', askRoute);

// Define uma rota GET em '/health' que retorna um status 200 e um JSON indicando que o serviço está ok
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Define a porta do servidor, usando a variável de ambiente PORT ou 3000 como padrão
const PORT = process.env.PORT || 3000;

// Adiciona a configuração para confiar em proxies
app.set('trust proxy', 1);

// Inicia o servidor e exibe uma mensagem no console indicando em qual porta está rodando
app.listen(PORT, () => console.log(`BFF rodando na porta ${PORT}`));