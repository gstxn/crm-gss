# GSS CRM

## Deploy na Vercel

Este projeto está configurado para ser facilmente implantado na Vercel. Siga os passos abaixo para fazer o deploy:

### Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) para o banco de dados em produção
3. Repositório do projeto no GitHub

### Passos para o Deploy

1. **Prepare seu banco de dados MongoDB Atlas**:
   - Crie um cluster no MongoDB Atlas
   - Configure um usuário e senha para o banco de dados
   - Obtenha a string de conexão
   - Substitua a string de conexão no arquivo `.env.production` do backend

2. **Configure as variáveis de ambiente**:
   - Atualize os arquivos `.env.production` com suas configurações reais
   - Certifique-se de usar senhas fortes para produção

3. **Faça o deploy na Vercel**:
   - Faça login na Vercel
   - Clique em "New Project"
   - Importe seu repositório do GitHub
   - Configure as variáveis de ambiente na interface da Vercel (copie do arquivo `.env.production`)
   - Clique em "Deploy"

4. **Após o deploy**:
   - A Vercel fornecerá uma URL para seu projeto (ex: `https://seu-projeto.vercel.app`)
   - Atualize a variável `FRONTEND_URL` nas configurações do projeto na Vercel para esta URL
   - Atualize a variável `REACT_APP_API_URL` para `https://seu-projeto.vercel.app/api`

### Estrutura do Projeto para Vercel

O projeto está configurado com os seguintes arquivos para o deploy na Vercel:

- `vercel.json` na raiz: Configura o projeto monorepo (frontend + backend)
- `frontend/vercel.json`: Configura o roteamento do frontend
- `backend/api/index.js`: Ponto de entrada para as funções serverless da Vercel

### Monitoramento e Manutenção

Após o deploy, você pode monitorar seu aplicativo através do painel da Vercel:

- Logs de execução
- Métricas de desempenho
- Configurações de domínio personalizado
- Configurações de ambiente

### Problemas Comuns

1. **Erro de CORS**: Verifique se a variável `FRONTEND_URL` está configurada corretamente
2. **Erro de conexão com o banco de dados**: Verifique se a string de conexão do MongoDB está correta e se o IP está liberado no MongoDB Atlas
3. **Erro 404 em rotas do frontend**: Verifique se o arquivo `vercel.json` do frontend está configurado corretamente