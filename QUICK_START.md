# 🚀 Quick Start - SaveMyMoney

Guia rápido para colocar o SaveMyMoney rodando em menos de 5 minutos!

---

## 📋 Pré-requisitos

Certifique-se de ter instalado:

- ✅ **Docker** e **Docker Compose** (recomendado)
  - [Download Docker](https://www.docker.com/get-started)

**OU** (se não usar Docker):

- ✅ **Node.js** 20+
- ✅ **Python** 3.11+
- ✅ **MongoDB** 8+
- ✅ **Redis** 7+ (opcional, mas recomendado)

---

## 🐳 Opção 1: Docker (Recomendado)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/SaveMyMoney.git
cd SaveMyMoney
```

### 2. Configure as variáveis de ambiente

```bash
# Copiar exemplo
cp .env.example .env

# Editar .env com seus valores
# Mínimo necessário:
# - MONGO_ROOT_PASSWORD
# - JWT_SECRET
```

### 3. Inicie todos os serviços

```bash
docker-compose up -d
```

Isso vai iniciar:
- ✅ MongoDB (porta 27017)
- ✅ Redis (porta 6379)
- ✅ Backend API (porta 5000)
- ✅ ML API (porta 8000)
- ✅ Frontend (porta 80)

### 4. Acesse a aplicação

Abra seu navegador em:

🌐 **http://localhost**

Pronto! 🎉

---

## 💻 Opção 2: Desenvolvimento Local (Sem Docker)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/SaveMyMoney.git
cd SaveMyMoney
```

### 2. Configure o Backend

```bash
cd server

# Instalar dependências
npm install

# Criar .env
cp .env.example .env

# Editar server/.env:
# MONGO_URI=mongodb://localhost:27017/savemymoney
# JWT_SECRET=seu_secret_super_secreto_aqui
# REDIS_URL=redis://localhost:6379  # opcional
# PORT=5000

# Iniciar servidor
npm run dev
```

### 3. Configure o Frontend

Em outro terminal:

```bash
cd client

# Instalar dependências
npm install

# Criar .env
cp .env.example .env

# Editar client/.env:
# VITE_API_URL=http://localhost:5000

# Iniciar aplicação
npm run dev
```

### 4. Configure a ML API (opcional)

Em outro terminal:

```bash
cd ml-api

# Criar ambiente virtual
python -m venv venv

# Ativar (Windows)
venv\Scripts\activate
# Ativar (Linux/Mac)
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Criar .env
cp .env.example .env

# Editar ml-api/.env:
# MONGODB_URI=mongodb://localhost:27017/savemymoney
# NODE_API_URL=http://localhost:5000

# Iniciar API
uvicorn app.main:app --reload --port 8000
```

### 5. Acesse a aplicação

🌐 **http://localhost:5173** (Vite dev server)

---

## 🎯 Opção 3: Início Rápido (Raiz do Projeto)

Se você tem Node.js instalado, pode usar o script da raiz:

```bash
# Instalar dependências
npm install

# Iniciar backend + frontend simultaneamente
npm run dev
```

Isso vai iniciar:
- ✅ Backend (http://localhost:5000)
- ✅ Frontend (http://localhost:5173)

**Nota:** ML API precisa ser iniciada separadamente (ver Opção 2, passo 4)

---

## ✅ Verificação

### Testar Backend

```bash
curl http://localhost:5000/api/ping
# Resposta: {"message":"pong","timestamp":"..."}

curl http://localhost:5000/api/health
# Resposta: {"status":"healthy",...}
```

### Testar ML API

```bash
curl http://localhost:8000/health
# Resposta: {"status":"healthy",...}
```

### Testar Frontend

Abra o navegador e veja se carrega a página inicial

---

## 🔐 Primeiro Acesso

1. **Registre-se** em `/register`
   - Nome completo
   - Email válido
   - Senha forte (min 8 chars, 1 maiúscula, 1 minúscula, 1 número, 1 especial)

2. **Faça Login** em `/login`

3. **Explore o Dashboard** em `/dashboard`

4. **Configure seus Orçamentos** em `/budgets`

5. **Adicione Transações** em `/transactions`

---

## 📚 Próximos Passos

Após colocar para rodar, explore:

### Recursos Básicos
- ✅ [Adicionar transações](http://localhost/transactions)
- ✅ [Configurar orçamentos](http://localhost/budgets)
- ✅ [Ver dashboard](http://localhost/dashboard)

### Recursos Avançados
- 🤖 [Previsões com IA](http://localhost/predictions)
- 💼 [Sugestões de investimentos](http://localhost/investments)
- 📊 [Portfólio](http://localhost/portfolio)
- 📷 [Upload de cupom fiscal](http://localhost/ocr)
- 📄 [Upload de extrato PDF](http://localhost/upload-statement)

### Configurações
- 🔒 [Ativar 2FA](http://localhost/settings) (futuro)
- 🌙 [Modo escuro](http://localhost) (botão no navbar)
- 📱 [Instalar PWA](http://localhost) (prompt aparece após 30s)

---

## 🐛 Problemas Comuns

### Backend não inicia

```bash
# Verificar se MongoDB está rodando
mongosh

# Verificar se porta 5000 está livre
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Linux/Mac
```

### Frontend não conecta à API

```bash
# Verificar se backend está rodando
curl http://localhost:5000/api/ping

# Verificar VITE_API_URL no client/.env
cat client/.env
```

### Docker não inicia

```bash
# Verificar logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### ML API timeout

```bash
# ML API é opcional para uso básico
# Só necessária para previsões
# Pode demorar no primeiro request (carregamento do modelo)
```

---

## 📊 Comandos Úteis

### Docker

```bash
# Ver logs em tempo real
docker-compose logs -f backend

# Parar tudo
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Rebuild imagem específica
docker-compose build backend

# Entrar no container
docker-compose exec backend sh
```

### Desenvolvimento

```bash
# Backend
cd server
npm run dev          # Dev mode com nodemon
npm test            # Rodar testes
npm run test:coverage  # Com coverage

# Frontend
cd client
npm run dev         # Dev mode com Vite
npm run build       # Build de produção
npm run preview     # Preview do build

# ML API
cd ml-api
uvicorn app.main:app --reload  # Dev mode
pytest              # Rodar testes
```

### Banco de Dados

```bash
# Conectar ao MongoDB
mongosh mongodb://localhost:27017/savemymoney

# Listar databases
show dbs

# Usar database
use savemymoney

# Listar collections
show collections

# Ver documentos
db.users.find()
db.transactions.find()
```

---

## 🎨 Personalização

### Mudar porta do backend

```env
# server/.env
PORT=3001
```

```env
# client/.env
VITE_API_URL=http://localhost:3001
```

### Mudar porta do frontend

```bash
# client/package.json
"dev": "vite --port 3000"
```

### Desabilitar Redis (cache)

```env
# server/.env
# Comentar ou remover:
# REDIS_URL=redis://localhost:6379
```

A aplicação vai funcionar sem cache.

### Desabilitar 2FA

Simplesmente não ative no perfil do usuário. É opcional.

---

## 📞 Suporte

- 📖 **Documentação Completa:** [README.md](./README.md)
- 🛠️ **Guia de Melhorias:** [MELHORIAS_IMPLEMENTADAS.md](./MELHORIAS_IMPLEMENTADAS.md)
- 📝 **Changelog:** [CHANGELOG.md](./CHANGELOG.md)
- 🐛 **Issues:** [GitHub Issues](https://github.com/seu-usuario/SaveMyMoney/issues)

---

## 🎉 Pronto!

Agora você tem o SaveMyMoney rodando localmente!

**Próximos passos:**
1. Crie sua primeira transação
2. Configure um orçamento
3. Complete o quiz de investidor
4. Explore as previsões com IA
5. Ative o modo escuro 🌙

**Divirta-se! 💰📊**
