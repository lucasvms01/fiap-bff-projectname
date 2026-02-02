const axios = require('axios');

async function askOpenAI() {
  const prompt = `Elabore 5 palavras distintas e seus respectivos significados e um exemplo de uso. Retorne um JSON no formato [{word, description, useCase}]. Não adicione quebras de linhas.`;

  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'Responda somente questões relacionadas ao ensino de inglês.' },
      { role: 'user', content: prompt }
    ]
  }, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    }
  });

  const message = response.data.choices[0].message.content.trim();

  return {
    answer: message,
    timestamp: new Date().toISOString()
  };
}

module.exports = { askOpenAI };