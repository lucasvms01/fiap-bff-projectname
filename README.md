# FIAP – Front-end Engineering  
## Projeto: English Vocab Helper com BFF próprio

---

# 1. Integrantes

- Jefferson Felipe Miranda – RA: 363349  
- Lucas Ventura Melo da Silva – RA: 361038  
- Luís Fernando de Oliveira – RA: 362539  
- Marcelo Pacheco Vieira da Cunha – RA: 360712  

---

# 2. Sobre o Projeto

Este projeto foi desenvolvido para a disciplina de Front-end Engineering com o objetivo de construir uma aplicação web que consome um BFF (Backend for Frontend) próprio, implementado em Node.js.

A aplicação permite que o usuário gere palavras em inglês dinamicamente, visualize sua descrição, casos de uso e escreva frases utilizando essas palavras, com validação gramatical automática.

O sistema foi estruturado separando claramente as responsabilidades entre Front-end e Back-end, atendendo aos requisitos da tarefa proposta.

---

# 3. Objetivo

O objetivo do projeto é:

- Construir um Front-end funcional e responsivo.
- Criar um BFF próprio em Node.js.
- Integrar o BFF com um provedor de IA.
- Exibir palavras, descrições e casos de uso.
- Permitir validação de frases escritas pelo usuário.
- Realizar deploy do Front-end.
- Realizar deploy da API própria.
- Documentar métricas de performance (Web Vitals).
- Entregar documentação completa via README estruturado.

---

# 4. Arquitetura

O projeto está dividido em duas camadas principais:

frontend → Aplicação Web
backend → API BFF (Node + Express)


## 4.1 Fluxo da Aplicação

1. O usuário acessa a aplicação web.
2. O Front-end realiza requisição para o endpoint `/ask`.
3. O BFF consulta um modelo de IA (Groq – compatível com OpenAI).
4. O BFF retorna um array estruturado com:
   - word
   - description
   - useCase
5. O Front-end renderiza os dados.
6. O usuário escreve uma frase.
7. A frase é validada via serviço de correção gramatical.

---

# 5. Tecnologias Utilizadas

## 5.1 Front-end

- HTML5
- CSS (TailwindCSS via CDN)
- JavaScript (Vanilla JS)
- Fetch API
- LanguageTool API

## 5.2 Back-end (BFF)

- Node.js
- Express
- Axios
- Integração com Groq API
- New Relic (monitoramento)
- Deploy via Render

---

# 6. Estrutura do Projeto

fiap-bff-projectname/
│
├── backend/
│ ├── src/
│ │ └── app.js
│ ├── package.json
│ ├── newrelic.js
│ └── .env
│
├── frontend/
│ ├── index.html
│ ├── app.js
│
├── package.json
└── README.md

---

# 7. Deploy

## 7.1 API (BFF)

Deploy realizado no Render.

URL da API:

https://fiap-bff-v2.onrender.com


Endpoint principal:

https://fiap-bff-v2.onrender.com/ask


## 7.2 Front-end

O Front-end pode ser executado localmente ou publicado como Static Site no Render.

---

# 8. Execução Local

## 8.1 Executar o Back-end

```bash
cd backend
npm install
npm start

A API ficará disponível em:

http://localhost:3001

8.2 Executar o Front-end

cd frontend
npx serve .

Ou utilizar a extensão Live Server do VS Code.

A aplicação poderá ser acessada em:

http://localhost:3000

9. Funcionalidades Implementadas

Geração dinâmica de palavras via IA.

Exibição de descrição.

Exibição de casos de uso.

Campo para escrita de frase.

Validação gramatical automática.

Sugestões de melhoria.

Filtro de palavras.

Integração com API própria.

Monitoramento com New Relic.

Separação clara entre Front-end e BFF.


10. Segurança e Boas Práticas

Uso de variáveis de ambiente (.env).

Arquivo .env não versionado.

node_modules ignorado via .gitignore.

Rate limit implementado no back-end.

Monitoramento ativo da API.

Organização modular do código.

11. Métricas de Performance (Web Vitals)

A aplicação foi analisada utilizando Lighthouse para avaliação de:

LCP (Largest Contentful Paint)

FID (First Input Delay)

CLS (Cumulative Layout Shift)

Performance Score

As métricas demonstram que a aplicação está dentro dos parâmetros aceitáveis de performance e estabilidade visual.

(Adicionar prints do Lighthouse conforme exigido na tarefa.)

12. Critérios da Tarefa Atendidos

Repositório público.

Deploy do Front-end.

Deploy da API própria.

README estruturado.

Integração com BFF próprio.

Uso de IA.

Validação de frase.

Monitoramento da aplicação.

Documentação das métricas Web Vitals.

13. Conclusão

O projeto demonstra a implementação completa de um fluxo Front-end + BFF com deploy em ambiente cloud, integração com IA, validação gramatical e monitoramento da aplicação, atendendo integralmente aos requisitos propostos na disciplina de Front-end Engineering.