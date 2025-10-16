# 🚀 Deploy no Render - SaveMyMoney

Este guia explica como fazer deploy da aplicação SaveMyMoney no Render.

---

## 📋 Pré-requisitos

- ✅ Conta no GitHub (gratuita)
- ✅ Conta no Render (gratuita) - https://render.com
- ✅ Conta no MongoDB Atlas (gratuita) - https://www.mongodb.com/cloud/atlas

---

## 🗄️ Passo 1: Configurar MongoDB Atlas (Gratuito)

O Render Free Tier não inclui MongoDB, então vamos usar o MongoDB Atlas (também gratuito).

### 1.1 Criar Conta no MongoDB Atlas

1. Acesse: https://www.mongodb.com/cloud/atlas/register
2. Crie uma conta gratuita
3. Escolha o plano **Free (M0)** - 512 MB de armazenamento

### 1.2 Criar Cluster

1. Clique em **"Build a Database"**
2. Escolha **"Shared"** (Free)
3. Selecione Provider: **AWS**
4. Região: Escolha a mais próxima (ex: **São Paulo (sa-east-1)**)
5. Nome do cluster: `savemymoney-cluster`
6. Clique em **"Create"**

### 1.3 Configurar Acesso ao Banco

**Criar usuário do banco:**

1. Quando aparecer **"Security Quickstart"**
2. Username: `savemymoney_user`
3. Password: Clique em **"Autogenerate Secure Password"** e **COPIE a senha**
4. Clique em **"Create User"**

**Configurar IP Whitelist:**

1. Em "Where would you like to connect from?"
2. Clique em **"Add My Current IP Address"**
3. **IMPORTANTE:** Adicione também `0.0.0.0/0` para permitir acesso do Render
   - Clique em **"Add IP Address"**
   - IP: `0.0.0.0/0`
   - Description: `Render Access`
   - Clique em **"Add Entry"**
4. Clique em **"Finish and Close"**

### 1.4 Obter Connection String

1. Clique em **"Connect"** no seu cluster
2. Escolha **"Connect your application"**
3. Driver: **Node.js**
4. Copie a connection string (parecido com):
   ```
   mongodb+srv://savemymoney_user:<password>@savemymoney-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **IMPORTANTE:** Substitua `<password>` pela senha que você copiou no passo 1.3
6. Adicione o nome do banco após `.net/`: `/savemymoney`

**Exemplo final:**
```
mongodb+srv://savemymoney_user:SuaSenhaAqui@savemymoney-cluster.xxxxx.mongodb.net/savemymoney?retryWrites=true&w=majority
```

**SALVE essa connection string!** Vamos usar no Render.

---

## 🐙 Passo 2: Push para GitHub

### 2.1 Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome: `SaveMyMoney` (ou outro de sua escolha)
3. Visibilidade: **Public** ou **Private**
4. **NÃO** marque "Initialize with README"
5. Clique em **"Create repository"**

### 2.2 Push do Projeto

No terminal, execute:

```bash
cd c:\SaveMyMoney

# Inicializar Git
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Initial commit - SaveMyMoney v2.0

Aplicação completa de gestão financeira com:
- Backend Node.js/Express
- Frontend React/Vite
- ML API Python/FastAPI
- 11 ETAPAs implementadas
- 18 melhorias de segurança, performance e UX

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Adicionar remote do GitHub (substitua SEU-USUARIO)
git remote add origin https://github.com/SEU-USUARIO/SaveMyMoney.git

# Push para GitHub
git branch -M main
git push -u origin main
```

**Se pedir autenticação:**
- Use seu GitHub Personal Access Token
- Como criar: https://github.com/settings/tokens
- Permissões necessárias: `repo`, `workflow`

---

## ☁️ Passo 3: Deploy no Render

### 3.1 Criar Conta no Render

1. Acesse: https://render.com
2. Clique em **"Get Started"**
3. Faça login com **GitHub**
4. Autorize o Render a acessar seus repositórios

### 3.2 Deploy do Backend

#### 3.2.1 Criar Web Service

1. No Dashboard do Render, clique em **"New +"**
2. Escolha **"Web Service"**
3. Conecte seu repositório **SaveMyMoney**
4. Clique em **"Connect"**

#### 3.2.2 Configurar Backend

**Settings básicos:**

- **Name:** `savemymoney-backend`
- **Region:** `Oregon (US West)` (ou mais próximo)
- **Branch:** `main`
- **Root Directory:** `server`
- **Environment:** `Node`
- **Build Command:**
  ```bash
  npm install
  ```
- **Start Command:**
  ```bash
  npm start
  ```
- **Plan:** `Free`

#### 3.2.3 Configurar Environment Variables

Clique em **"Advanced"** e adicione as variáveis:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGO_URI` | Sua connection string do MongoDB Atlas (do Passo 1.4) |
| `JWT_SECRET` | Gere uma senha forte (ex: use https://randomkeygen.com/) |

**Opcional (se quiser usar Sentry):**
| Key | Value |
|-----|-------|
| `SENTRY_DSN` | Seu DSN do Sentry (deixe vazio se não usar) |

#### 3.2.4 Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build (5-10 minutos)
3. Quando aparecer **"Live"**, seu backend está no ar! 🎉

**Copie a URL do backend** (ex: `https://savemymoney-backend.onrender.com`)

#### 3.2.5 Criar Usuário Admin

Após o deploy, precisamos criar o usuário admin no MongoDB Atlas:

**Opção A - Via Render Shell:**

1. No dashboard do seu backend, clique em **"Shell"** (no canto superior direito)
2. Execute:
   ```bash
   npm run seed:admin
   ```

**Opção B - Via MongoDB Atlas Interface:**

1. Acesse MongoDB Atlas
2. Clique em **"Browse Collections"**
3. Clique em **"Add My Own Data"**
4. Database: `savemymoney`
5. Collection: `users`
6. Clique em **"Insert Document"**
7. Cole o JSON (gere com o script local):
   ```bash
   # No seu computador
   cd c:\SaveMyMoney\server
   node scripts/generateAdminHash.js
   # Copie o comando db.users.insertOne(...) gerado
   ```
8. No MongoDB Atlas, cole o JSON dentro do insertOne (sem o comando)

### 3.3 Deploy do Frontend

#### 3.3.1 Criar Static Site

1. No Dashboard do Render, clique em **"New +"**
2. Escolha **"Static Site"**
3. Selecione o repositório **SaveMyMoney**
4. Clique em **"Connect"**

#### 3.3.2 Configurar Frontend

**Settings básicos:**

- **Name:** `savemymoney-frontend`
- **Branch:** `main`
- **Root Directory:** `client`
- **Build Command:**
  ```bash
  npm install && npm run build
  ```
- **Publish Directory:** `dist`

#### 3.3.3 Configurar Environment Variable

Adicione a variável que aponta para o backend:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | URL do backend (ex: `https://savemymoney-backend.onrender.com`) |

#### 3.3.4 Configurar Redirects

1. Clique em **"Redirects/Rewrites"** na sidebar
2. Adicione uma regra:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`
3. Clique em **"Save Changes"**

#### 3.3.5 Deploy

1. Clique em **"Create Static Site"**
2. Aguarde o build (3-5 minutos)
3. Quando aparecer **"Live"**, seu frontend está no ar! 🎉

**URL do frontend:** `https://savemymoney-frontend.onrender.com`

### 3.4 Atualizar CORS no Backend (Importante!)

O backend precisa permitir requisições do frontend.

#### No código (já está configurado no server/index.js):

Verifique se o arquivo `server/index.js` tem:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL, // URL do frontend no Render
    /\.onrender\.com$/ // Permite qualquer subdomínio do Render
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

Se não tiver, adicione a variável de ambiente:

**No Render Backend:**
1. Vá em **Environment**
2. Adicione:
   - Key: `FRONTEND_URL`
   - Value: `https://savemymoney-frontend.onrender.com`
3. Clique em **"Save Changes"**
4. O serviço vai reiniciar automaticamente

### 3.5 Atualizar API URL no Frontend

O frontend precisa saber onde está o backend.

**No código (client/src/services/api.js):**

Já está configurado para usar `VITE_API_URL`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

A variável `VITE_API_URL` que você configurou no Passo 3.3.3 já resolve isso!

---

## 🧪 Passo 4: Testar a Aplicação

### 4.1 Acessar o Frontend

Abra a URL do seu frontend: `https://savemymoney-frontend.onrender.com`

### 4.2 Fazer Login

- **Email:** `admin@savemymoney.com`
- **Senha:** `admin@123`

### 4.3 Verificar Backend

Teste o health check: `https://savemymoney-backend.onrender.com/api/health`

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2025-10-16T..."
}
```

---

## 🔧 Passo 5: Deploy da ML API (Opcional)

A API de Machine Learning é opcional, mas adiciona previsões inteligentes.

### 5.1 Criar Web Service para ML API

1. No Dashboard do Render, clique em **"New +"**
2. Escolha **"Web Service"**
3. Selecione o repositório **SaveMyMoney**

### 5.2 Configurar ML API

**Settings básicos:**

- **Name:** `savemymoney-ml-api`
- **Region:** `Oregon (US West)`
- **Branch:** `main`
- **Root Directory:** `ml_api`
- **Environment:** `Python 3`
- **Build Command:**
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command:**
  ```bash
  uvicorn app:app --host 0.0.0.0 --port $PORT
  ```
- **Plan:** `Free`

### 5.3 Environment Variables

| Key | Value |
|-----|-------|
| `PORT` | `5001` |
| `ENVIRONMENT` | `production` |

### 5.4 Atualizar Backend com ML API URL

**No Render Backend Environment:**

| Key | Value |
|-----|-------|
| `ML_API_URL` | `https://savemymoney-ml-api.onrender.com` |

---

## 📊 Resumo das URLs

Após o deploy completo, você terá:

| Serviço | URL | Status |
|---------|-----|--------|
| **Frontend** | `https://savemymoney-frontend.onrender.com` | ✅ |
| **Backend** | `https://savemymoney-backend.onrender.com` | ✅ |
| **ML API** | `https://savemymoney-ml-api.onrender.com` | ⚠️ Opcional |
| **MongoDB** | MongoDB Atlas | ✅ |

---

## ⚠️ Limitações do Plano Free

O plano gratuito do Render tem algumas limitações:

### 🐌 Cold Starts
- **Problema:** Serviços dormem após 15 minutos de inatividade
- **Efeito:** Primeira requisição após período inativo pode levar 30-60 segundos
- **Solução:** Use um serviço de "ping" como UptimeRobot (gratuito) para manter ativo

### 💾 Recursos Limitados
- **CPU:** Compartilhado
- **RAM:** 512 MB
- **Bandwidth:** 100 GB/mês
- **Build Time:** 90 segundos/build

### 🔄 Reinicializações Automáticas
- Serviços podem reiniciar sem aviso
- Use sempre tratamento de erros robusto

---

## 🚀 Melhorias para Produção

### 1. Domínio Customizado (Recomendado)

**Custo:** $0 (se já tiver domínio) ou ~$10/ano

1. Compre um domínio (ex: Namecheap, GoDaddy)
2. No Render, vá em **Settings > Custom Domain**
3. Adicione: `app.seudominio.com`
4. Configure DNS conforme instruções do Render

### 2. Upgrade para Plano Pago (Opcional)

**Starter Plan:** $7/mês por serviço

Vantagens:
- ✅ Sem cold starts
- ✅ Mais recursos (1 GB RAM)
- ✅ Builds mais rápidos
- ✅ Suporte prioritário

### 3. CDN para Assets (Recomendado)

Use Cloudflare (gratuito) na frente do Render:
- ✅ Cache de assets estáticos
- ✅ DDoS protection
- ✅ SSL/TLS automático
- ✅ Melhor performance global

### 4. Monitoramento

**Gratuito:**
- [UptimeRobot](https://uptimerobot.com/) - Monitora uptime
- [LogTail](https://logtail.com/) - Logs centralizados
- [Sentry](https://sentry.io/) - Error tracking (já integrado!)

### 5. Backup do MongoDB Atlas

1. No MongoDB Atlas, vá em **Backup**
2. Habilite backups automáticos (gratuito no plano M0)
3. Configure snapshot retention

---

## 🐛 Troubleshooting

### Frontend não conecta ao Backend

**Problema:** CORS error no console

**Solução:**
1. Verifique `VITE_API_URL` no frontend
2. Verifique `FRONTEND_URL` no backend
3. Verifique se o backend está usando `cors()` corretamente

### Backend não conecta ao MongoDB

**Problema:** "MongoNetworkError" ou "Authentication failed"

**Solução:**
1. Verifique `MONGO_URI` está correto
2. Verifique senha no connection string
3. Verifique IP `0.0.0.0/0` está na whitelist do Atlas
4. Teste a conexão no MongoDB Compass

### Build falha no Render

**Problema:** "npm install failed" ou timeout

**Solução:**
1. Verifique `package.json` está no diretório correto
2. Verifique Root Directory está configurado
3. Veja logs completos no Render
4. Tente limpar cache: Settings > Clear Build Cache

### Usuário admin não existe

**Problema:** "Invalid Credentials" ao fazer login

**Solução:**
1. Use o Render Shell para rodar `npm run seed:admin`
2. Ou crie manualmente no MongoDB Atlas (veja Passo 3.2.5)

### Cold Start muito lento

**Solução:**
1. Configure UptimeRobot para fazer ping a cada 10 minutos:
   - URL: `https://savemymoney-backend.onrender.com/api/health`
   - Interval: 10 minutes
2. Ou faça upgrade para Starter Plan ($7/mês)

---

## 📝 Checklist de Deploy

### Antes do Deploy
- [ ] Código commitado no GitHub
- [ ] `.gitignore` configurado (não enviar `.env`, `node_modules`)
- [ ] MongoDB Atlas criado e configurado
- [ ] Connection string do MongoDB copiada
- [ ] JWT_SECRET gerado (senha forte)

### Durante o Deploy
- [ ] Backend deployado no Render
- [ ] Environment variables configuradas
- [ ] Frontend deployado no Render
- [ ] VITE_API_URL apontando para backend
- [ ] Redirects configurados no frontend
- [ ] Usuário admin criado

### Após o Deploy
- [ ] Testar health check do backend
- [ ] Testar login no frontend
- [ ] Criar transação de teste
- [ ] Verificar Dashboard carrega
- [ ] Testar modo escuro
- [ ] Verificar responsividade mobile

### Segurança
- [ ] Mudar senha do admin após primeiro login
- [ ] Configurar CORS corretamente
- [ ] Ativar 2FA para conta admin
- [ ] Revisar IP whitelist do MongoDB
- [ ] Configurar backups no MongoDB Atlas

---

## 🎉 Pronto!

Sua aplicação SaveMyMoney está no ar! 🚀

**Próximos passos:**
1. ✅ Faça login com admin@savemymoney.com / admin@123
2. ✅ Mude a senha do admin
3. ✅ Crie algumas transações de teste
4. ✅ Configure orçamentos
5. ✅ Explore todas as funcionalidades

**Compartilhe sua aplicação:**
- Frontend: `https://savemymoney-frontend.onrender.com`

---

## 📞 Suporte

**Problemas com o Deploy?**

1. **Render Docs:** https://render.com/docs
2. **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com/
3. **Community:** https://community.render.com/

**Problemas com a Aplicação?**

1. Verifique logs no Render Dashboard
2. Abra o Console do navegador (F12)
3. Revise [CORREÇÕES_APLICADAS.md](./CORREÇÕES_APLICADAS.md)
4. Consulte [LEIA-ME_PRIMEIRO.md](./LEIA-ME_PRIMEIRO.md)

---

**Versão:** 2.0.0
**Data:** 2025-10-16
**Plataforma:** Render.com + MongoDB Atlas
