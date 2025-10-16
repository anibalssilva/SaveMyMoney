# ⚡ Comandos Rápidos - SaveMyMoney

Este arquivo contém todos os comandos necessários para fazer push e deploy, prontos para copiar e colar!

---

## 🐙 PASSO 1: Push para GitHub

### 1. Criar repositório no GitHub
Acesse: https://github.com/new
- Nome: `SaveMyMoney`
- Visibilidade: Public
- Clique em "Create repository"

### 2. Copiar URL do repositório
```
https://github.com/SEU-USUARIO/SaveMyMoney.git
```

### 3. Executar comandos (substitua SEU-USUARIO)

```bash
# Adicionar remote
git remote add origin https://github.com/SEU-USUARIO/SaveMyMoney.git

# Verificar
git remote -v

# Push
git push -u origin main
```

**Autenticação:**
- Username: seu-usuario-github
- Password: seu-personal-access-token (não a senha!)
- Criar token em: https://github.com/settings/tokens

---

## ☁️ PASSO 2: MongoDB Atlas

### 1. Criar conta
Acesse: https://www.mongodb.com/cloud/atlas/register

### 2. Criar cluster
- Plan: **Free (M0)**
- Provider: **AWS**
- Região: **São Paulo (sa-east-1)**
- Nome: `savemymoney-cluster`

### 3. Configurar usuário
- Username: `savemymoney_user`
- Password: **[Autogenerate e COPIAR]**

### 4. Whitelist IP
Adicione: `0.0.0.0/0` (para permitir Render)

### 5. Obter connection string
Copie e ajuste:
```
mongodb+srv://savemymoney_user:SUA_SENHA_AQUI@savemymoney-cluster.xxxxx.mongodb.net/savemymoney?retryWrites=true&w=majority
```

⚠️ **SALVE essa string!** Você vai usar no Render.

---

## 🚀 PASSO 3: Deploy Backend no Render

### 1. Criar conta
Acesse: https://render.com
- Clique em "Get Started"
- Login com GitHub

### 2. Criar Web Service
- Dashboard → "New +" → "Web Service"
- Conecte seu repositório **SaveMyMoney**

### 3. Configurações do Backend

Copie e cole estas configurações:

**Básico:**
- **Name:** `savemymoney-backend`
- **Region:** `Oregon (US West)`
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

**Environment Variables:**

Clique em "Advanced" e adicione:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGO_URI` | `sua-connection-string-do-atlas` |
| `JWT_SECRET` | `gere-senha-forte-em-randomkeygen.com` |

### 4. Deploy
Clique em "Create Web Service" e aguarde 5-10 minutos.

### 5. Copiar URL do backend
Após deploy, copie a URL:
```
https://savemymoney-backend.onrender.com
```

### 6. Criar usuário admin

Após o deploy, crie o admin:

**Opção A - Via Render Shell:**
1. No dashboard do backend → Clique em "Shell"
2. Execute:
   ```bash
   npm run seed:admin
   ```

**Opção B - Via MongoDB Atlas:**
1. Acesse MongoDB Atlas → Browse Collections
2. Database: `savemymoney`
3. Collection: `users`
4. Insert Document → Cole JSON do admin (gere localmente com `node server/scripts/generateAdminHash.js`)

---

## 🌐 PASSO 4: Deploy Frontend no Render

### 1. Criar Static Site
- Dashboard → "New +" → "Static Site"
- Conecte o repositório **SaveMyMoney**

### 2. Configurações do Frontend

**Básico:**
- **Name:** `savemymoney-frontend`
- **Branch:** `main`
- **Root Directory:** `client`
- **Build Command:**
  ```bash
  npm install && npm run build
  ```
- **Publish Directory:** `dist`

**Environment Variable:**

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://savemymoney-backend.onrender.com` |

### 3. Configurar Redirects

Após criar, vá em:
- Settings → Redirects/Rewrites
- Adicione:
  - Source: `/*`
  - Destination: `/index.html`
  - Action: `Rewrite`

### 4. Deploy
Clique em "Create Static Site" e aguarde 3-5 minutos.

### 5. Sua aplicação está no ar! 🎉

URL: `https://savemymoney-frontend.onrender.com`

---

## 🧪 PASSO 5: Testar

### 1. Acessar frontend
```
https://savemymoney-frontend.onrender.com
```

### 2. Fazer login
```
Email: admin@savemymoney.com
Senha: admin@123
```

### 3. Verificar backend health
```
https://savemymoney-backend.onrender.com/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

---

## 🔧 Comandos Úteis (Desenvolvimento Local)

### Instalar dependências

```bash
# Backend
cd server
npm install

# Frontend
cd client
npm install

# ML API (opcional)
cd ml-api
pip install -r requirements.txt
```

### Rodar localmente

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm run dev

# Terminal 3 - ML API (opcional)
cd ml-api
uvicorn app.main:app --reload --port 5001
```

### Criar admin local

```bash
# Certifique-se que MongoDB está rodando primeiro!
cd server
npm run seed:admin
```

### Testes

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# Coverage
cd server
npm run test:coverage
```

---

## 🔍 Verificação de Status

### Verificar se serviços estão rodando

```bash
# Ver processos Node
# Windows:
tasklist | findstr node

# Linux/Mac:
ps aux | grep node
```

### Verificar portas em uso

```bash
# Windows:
netstat -ano | findstr :5000
netstat -ano | findstr :5173

# Linux/Mac:
lsof -i :5000
lsof -i :5173
```

### Testar API com curl

```bash
# Health check
curl https://savemymoney-backend.onrender.com/api/health

# Login
curl -X POST https://savemymoney-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@savemymoney.com","password":"admin@123"}'

# Transações (substitua TOKEN)
curl https://savemymoney-backend.onrender.com/api/transactions \
  -H "x-auth-token: SEU_TOKEN"
```

---

## 🐛 Troubleshooting Rápido

### CORS Error

**Problema:** Frontend não conecta ao backend

**Solução:**
```bash
# No Render Backend, adicione env var:
FRONTEND_URL=https://savemymoney-frontend.onrender.com

# Reinicie o serviço
```

### MongoDB Connection Error

**Problema:** Backend não conecta ao MongoDB

**Solução:**
1. Verifique `MONGO_URI` está correto
2. Verifique senha na connection string
3. Verifique IP `0.0.0.0/0` na whitelist do Atlas
4. Teste conexão no MongoDB Compass

### Build Failed

**Problema:** Build falha no Render

**Solução:**
1. Verifique Root Directory está correto
2. Verifique `package.json` existe no diretório
3. Veja logs completos no Render
4. Limpe cache: Settings → Clear Build Cache

### 404 Not Found

**Problema:** Rotas do frontend retornam 404

**Solução:**
1. Verifique Redirects/Rewrites configurado
2. Verifique Publish Directory é `dist`
3. Teste build local: `npm run build && npm run preview`

---

## 📞 Links Úteis

| Recurso | URL |
|---------|-----|
| Render Dashboard | https://dashboard.render.com |
| MongoDB Atlas | https://cloud.mongodb.com |
| GitHub Repo | https://github.com/SEU-USUARIO/SaveMyMoney |
| GitHub Tokens | https://github.com/settings/tokens |
| Random Key Gen | https://randomkeygen.com/ |
| Render Docs | https://render.com/docs |
| MongoDB Docs | https://docs.atlas.mongodb.com/ |

---

## 📋 Checklist Completo

### Preparação
- [x] Projeto completo e testado
- [x] Git inicializado
- [x] Commit criado
- [ ] ⏳ GitHub repo criado
- [ ] ⏳ Push para GitHub

### Deploy
- [ ] MongoDB Atlas configurado
- [ ] Connection string obtida
- [ ] Render backend criado
- [ ] Env vars backend configuradas
- [ ] Render frontend criado
- [ ] Env vars frontend configuradas
- [ ] Redirects configurados
- [ ] Admin user criado

### Verificação
- [ ] Frontend carrega
- [ ] Login funciona
- [ ] Dashboard mostra dados
- [ ] API responde
- [ ] MongoDB conectado

### Segurança
- [ ] Senha admin mudada
- [ ] JWT_SECRET forte
- [ ] MongoDB whitelist configurado
- [ ] .env não commitado
- [ ] Tokens salvos com segurança

---

## 🎯 Tempo Estimado

| Etapa | Tempo |
|-------|-------|
| Push GitHub | 5 min |
| MongoDB Atlas | 10 min |
| Deploy Backend | 15 min |
| Deploy Frontend | 10 min |
| Testes | 5 min |
| **TOTAL** | **~45 min** |

---

## ✅ Após Deploy Completo

Você terá:

✅ Aplicação web online e acessível
✅ Backend API funcionando
✅ Banco de dados na nuvem
✅ Frontend responsivo
✅ HTTPS automático
✅ CI/CD com GitHub Actions
✅ Logs e monitoramento

**URLs finais:**
- Frontend: `https://savemymoney-frontend.onrender.com`
- Backend: `https://savemymoney-backend.onrender.com`
- GitHub: `https://github.com/SEU-USUARIO/SaveMyMoney`

---

## 🎉 Pronto!

Agora é só seguir os passos e você terá sua aplicação no ar!

**Ordem de execução:**
1. ⏳ PASSO 1: Push para GitHub
2. ⏳ PASSO 2: MongoDB Atlas
3. ⏳ PASSO 3: Deploy Backend
4. ⏳ PASSO 4: Deploy Frontend
5. ⏳ PASSO 5: Testar

**Boa sorte! 🚀**
