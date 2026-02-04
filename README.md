# FIAP – Front-end Engineering  
## Projeto: English Vocab Helper com BFF próprio

---

## 1. Integrantes

- Jefferson Felipe Miranda – RA: 363349  
- Lucas Ventura Melo da Silva – RA: 361038  
- Luís Fernando de Oliveira – RA: 362539  
- Marcelo Pacheco Vieira da Cunha – RA: 360712  

---

## 2. Sobre o Projeto

Este projeto foi desenvolvido para a disciplina de Front-end Engineering com o objetivo de implementar uma aplicação web consumindo um BFF (Backend for Frontend) próprio, garantindo desacoplamento entre interface e integração com serviços externos.

A aplicação permite que o usuário:

- Gere palavras em inglês dinamicamente via IA
- Visualize:
  - word
  - type
  - description (definição em português)
  - useCaseEn (frase em inglês utilizando a palavra)
- Escreva frases utilizando a palavra gerada
- Receba validação gramatical automática
- Alterne entre tema claro, escuro ou sistema
- Configure dinamicamente o endpoint da API

O projeto segue boas práticas de arquitetura, organização modular e separação de responsabilidades.

---

## 3. Arquitetura

O sistema está dividido em duas camadas principais:

- Frontend → Aplicação Web (HTML + TailwindCSS + JavaScript)
- Backend (BFF) → API própria em Node.js + Express

### Fluxo da Aplicação

1. O usuário acessa o Front-end
2. O Front realiza requisição para /ask
3. O BFF consulta um modelo de IA via Groq API
4. O BFF normaliza e valida a resposta
5. O BFF retorna um array estruturado contendo:
   - word
   - type
   - description
   - useCaseEn
6. O Front renderiza os dados
7. O usuário escreve uma frase
8. A frase é validada via LanguageTool API

---

## 4. Estrutura da Resposta da API

Exemplo de retorno do endpoint /ask:

    [
      {
        "word": "resilient",
        "type": "adjective",
        "description": "Capaz de se recuperar rapidamente de dificuldades.",
        "useCaseEn": "She is resilient even in challenging situations."
      }
    ]

O BFF garante que todos os itens retornados estejam completos antes de serem entregues ao Front-end.

---

## 5. Tecnologias Utilizadas

### Front-end

- HTML5  
- TailwindCSS  
- JavaScript (Vanilla)  
- Fetch API  
- LanguageTool API  

### Back-end (BFF)

- Node.js  
- Express  
- Axios  
- Groq API  
- Joi (validação de schema)  
- Express-rate-limit  
- CORS  
- New Relic  
- Deploy via Render  

---

## 6. Estrutura do Projeto

    fiap-bff-projectname/
    │
    ├── backend/
    │   ├── controllers/
    │   ├── routes/
    │   ├── services/
    │   ├── schemas/
    │   ├── middlewares/
    │   ├── app.js
    │   └── package.json
    │
    ├── frontend/
    │   ├── index.html
    │   └── app.js
    │
    ├── docs/
    │   └── images/
    │       ├── lighthouse-performance.png
    │       ├── lighthouse-accessibility.png
    │       └── ...
    │
    └── README.md

---

## 7. Deploy

### API (BFF)

Deploy realizado no Render.

URL da API:  
https://fiap-bff-v2.onrender.com  

Endpoint principal:  
https://fiap-bff-v2.onrender.com/ask  

---

### Front-end

Deploy realizado como Static Site no Render.

URL do site:  
https://fiap-front-v2.onrender.com  

---

## 8. Execução Local

### Back-end

    cd backend
    npm install
    npm start

A API ficará disponível em:

http://localhost:3001

---

### Front-end

    cd frontend
    npx serve .

Ou utilizar Live Server no VS Code.

---

## Links do Projeto (Produção)

- Repositório (GitHub): https://github.com/lucasvms01/fiap-bff-projectname  
- Site (Front-end em Cloud): https://fiap-front-v2.onrender.com  
- API (BFF em Cloud): https://fiap-bff-v2.onrender.com  
- Endpoint principal: https://fiap-bff-v2.onrender.com/ask  

---

## 9. Funcionalidades Implementadas

- Geração dinâmica de palavras via IA
- Controle de dificuldade (easy, medium, hard, veryhard)
- Normalização da resposta da IA
- Cache inteligente para pools maiores
- Campo de escrita de frase
- Validação gramatical automática
- Sugestões de correção
- Alternância de tema (claro/escuro/sistema)
- Configuração dinâmica do endpoint
- Rate limit na API
- Monitoramento com New Relic
- Tratamento centralizado de erros
- Identificação de requisição (requestId)

---

## 10. Segurança e Boas Práticas

- Uso de variáveis de ambiente (.env)
- .env não versionado
- node_modules ignorado via .gitignore
- Validação de entrada via schema
- Rate limit configurado
- CORS configurado
- Middleware global de erro
- Normalização do retorno da IA
- Organização modular do código

---

## 11. Métricas de Performance (Web Vitals)

A aplicação foi analisada utilizando o Lighthouse no ambiente de produção (Render).

### Métricas avaliadas

- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- Performance Score

As métricas demonstram boa estabilidade visual e desempenho adequado.

### Relatórios Lighthouse

#### 1. Performance
![alt text](docs/images/image.png)

#### 2. Accessibility
![alt text](docs/images/image-1.png)

#### 3. Best Practices
![alt text](docs/images/image-2.png)

#### 4. SEO
![alt text](docs/images/image-3.png)

#### 5. Diagnósticos Complementares
![alt text](docs/images/image-4.png)
![alt text](docs/images/image-5.png)
![alt text](docs/images/image-6.png)
![alt text](docs/images/image-7.png)

---

## 12. Critérios da Tarefa Atendidos

- Repositório público
- Deploy do Front-end em cloud
- Deploy da API própria (BFF)
- Integração com IA
- Validação gramatical automática
- README estruturado
- Monitoramento da aplicação
- Documentação das métricas Web Vitals

---

## 13. Conclusão

O projeto demonstra a implementação de uma arquitetura Front-end + BFF com integração a IA, validação gramatical automática, deploy em ambiente cloud e aplicação de boas práticas de engenharia de software.

A separação entre camadas, a validação estruturada da resposta da IA e o tratamento centralizado de erros tornam a aplicação mais robusta, previsível e alinhada a padrões profissionais de desenvolvimento.

---

## Observação

Caso você abra e o mesmo não retorne, clique em configuração, e peça para ver o endpoint que a API ira acordar.