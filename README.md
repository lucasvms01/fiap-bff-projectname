# FIAP BFF – Deploy Automático com Github Actions e Render.com

Este projeto faz parte de um tutorial prático de Backend For Frontend (BFF) utilizando Node.js e Express.

---

## O que foi feito nesta branch?

### Configuração de Deploy Automático com Github Actions e Render.com

Nesta branch, foi configurada uma **Github Action** para realizar o deploy automático da aplicação no [Render.com](https://render.com/). Agora, sempre que houver um push ou merge na branch principal do repositório, a action é executada e faz o deploy da versão mais recente da aplicação no ambiente configurado do Render.

- **O que é Github Actions?**  
  Github Actions é uma plataforma de automação de workflows dentro do Github, permitindo criar pipelines de integração contínua (CI) e entrega contínua (CD) para automatizar testes, builds e deploys.

- **O que é o Render.com?**  
  Render.com é uma plataforma de cloud que facilita o deploy de aplicações web, APIs e serviços de backend, oferecendo integração simples com repositórios do Github.

- **Como foi configurado?**  
  Foi criado um arquivo de workflow na pasta `.github/workflows/` do projeto, contendo os passos necessários para instalar as dependências, rodar testes (se houver) e fazer o deploy no Render.com utilizando a API da plataforma.

---

## Como executar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie a aplicação:
   ```bash
   node src/app.js
   ```

## O que mudou?

[Clique e veja o que foi feito nesta branch](https://github.com/jaisonschmidt/fiap-bff/compare/05-configure-newrelic...06-configure-actions)

---

## Parabéns, você chegou ao fim do tutorial!
