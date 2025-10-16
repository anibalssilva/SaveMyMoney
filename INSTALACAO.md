# 📦 Guia de Instalação - SaveMyMoney v2.0

Este guia detalha a instalação completa de todas as dependências e configurações necessárias.

---

## 🎯 Escolha seu Método de Instalação

1. **[Docker](#-opção-1-docker-recomendado)** - Mais fácil e rápido ⭐
2. **[Manual](#-opção-2-instalação-manual)** - Controle total
3. **[Desenvolvimento](#-opção-3-modo-desenvolvimento)** - Para contribuir

---

## 🐳 Opção 1: Docker (Recomendado)

### Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+

**Instalação do Docker:**
- Windows: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Mac: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Linux:
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  ```

### Passos de Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/SaveMyMoney.git
cd SaveMyMoney

# 2. Configure variáveis de ambiente
cp .env.example .env
nano .env  # ou seu editor preferido

# Variáveis mínimas necessárias:
# MONGO_ROOT_PASSWORD=seu_password_seguro
# JWT_SECRET=seu_secret_super_secreto

# 3. Inicie todos os serviços
docker-compose up -d

# 4. Verifique os logs
docker-compose logs -f

# 5. Acesse a aplicação
# http://localhost (ou porta configurada)
```

### Serviços Iniciados

- ✅ MongoDB (porta 27017)
- ✅ Redis (porta 6379)
- ✅ Backend API (porta 5000)
- ✅ ML API (porta 8000)
- ✅ Frontend (porta 80)

### Comandos Úteis Docker

```bash
# Parar todos os serviços
docker-compose down

# Parar e remover volumes (ATENÇÃO: apaga dados)
docker-compose down -v

# Ver status
docker-compose ps

# Ver logs de serviço específico
docker-compose logs -f backend

# Rebuild após mudanças
docker-compose build
docker-compose up -d

# Entrar em um container
docker-compose exec backend sh
```

---

## 💻 Opção 2: Instalação Manual

### Pré-requisitos

#### Sistema Operacional
- Windows 10/11, macOS 10.15+, ou Linux (Ubuntu 20.04+)

#### Software Necessário

1. **Node.js 20+**
   ```bash
   # Verificar versão
   node --version  # deve ser v20.x.x ou superior

   # Instalar (se necessário)
   # Windows/Mac: https://nodejs.org/
   # Linux:
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Python 3.11+**
   ```bash
   # Verificar versão
   python --version  # ou python3 --version

   # Instalar (se necessário)
   # Windows: https://www.python.org/downloads/
   # Mac: brew install python@3.11
   # Linux: sudo apt-get install python3.11 python3-pip
   ```

3. **MongoDB 8+**
   ```bash
   # Windows: https://www.mongodb.com/try/download/community
   # Mac: brew tap mongodb/brew && brew install mongodb-community@8
   # Linux:
   wget -qO - https://www.mongodb.org/static/pgp/server-8.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   sudo systemctl start mongod
   ```

4. **Redis 7+ (Opcional mas recomendado)**
   ```bash
   # Windows: https://github.com/microsoftarchive/redis/releases
   # Mac: brew install redis && brew services start redis
   # Linux:
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

### Instalação Passo a Passo

#### 1. Backend (Node.js)

```bash
cd server

# Instalar dependências
npm install

# Criar arquivo de ambiente
cp .env.example .env

# Editar .env
nano .env
```

**Configuração mínima do .env:**
```env
MONGO_URI=mongodb://localhost:27017/savemymoney
JWT_SECRET=seu_secret_super_secreto_aqui
PORT=5000
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

**Testar instalação:**
```bash
npm run dev
# Deve mostrar: "Server is running on port 5000"
```

#### 2. Frontend (React)

```bash
cd client

# Instalar dependências
npm install

# Criar arquivo de ambiente
cp .env.example .env

# Editar .env
nano .env
```

**Configuração do .env:**
```env
VITE_API_URL=http://localhost:5000
```

**Testar instalação:**
```bash
npm run dev
# Deve abrir em: http://localhost:5173
```

#### 3. ML API (Python)

```bash
cd ml-api

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Criar arquivo de ambiente
cp .env.example .env

# Editar .env
nano .env
```

**Configuração do .env:**
```env
MONGODB_URI=mongodb://localhost:27017/savemymoney
NODE_API_URL=http://localhost:5000
```

**Testar instalação:**
```bash
uvicorn app.main:app --reload --port 8000
# Acesse: http://localhost:8000/docs
```

### Verificação da Instalação

```bash
# 1. Testar MongoDB
mongosh
> show dbs
> exit

# 2. Testar Redis (se instalado)
redis-cli ping
# Deve responder: PONG

# 3. Testar Backend
curl http://localhost:5000/api/ping
# Resposta: {"message":"pong","timestamp":"..."}

# 4. Testar Frontend
# Abrir navegador em http://localhost:5173

# 5. Testar ML API
curl http://localhost:8000/health
# Resposta: {"status":"healthy",...}
```

---

## 🔧 Opção 3: Modo Desenvolvimento

Para contribuidores e desenvolvedores.

### Ferramentas Adicionais

```bash
# Git
git --version

# Editor de código (recomendado)
# - VS Code: https://code.visualstudio.com/
# - WebStorm: https://www.jetbrains.com/webstorm/

# Extensões VS Code recomendadas:
# - ESLint
# - Prettier
# - Docker
# - MongoDB for VS Code
# - Python
```

### Configuração de Desenvolvimento

```bash
# 1. Fork e clone
git clone https://github.com/SEU-USUARIO/SaveMyMoney.git
cd SaveMyMoney

# 2. Instalar todas as dependências
npm install  # Na raiz (instala concurrently)
cd server && npm install && cd ..
cd client && npm install && cd ..
cd ml-api && pip install -r requirements.txt && cd ..

# 3. Configurar pre-commit hooks (futuro)
# npm install -g husky
# husky install

# 4. Iniciar em modo dev
npm run dev
# Isso inicia backend + frontend simultaneamente
```

### Scripts de Desenvolvimento

```bash
# Backend
cd server
npm run dev          # Nodemon com auto-reload
npm test            # Rodar testes
npm run test:watch  # Testes em watch mode
npm run test:coverage  # Coverage report

# Frontend
cd client
npm run dev         # Vite dev server
npm run build       # Build de produção
npm run preview     # Preview do build

# ML API
cd ml-api
uvicorn app.main:app --reload  # Auto-reload
pytest              # Rodar testes
pytest --cov        # Com coverage
```

---

## 🔍 Troubleshooting

### Problema: Porta já em uso

```bash
# Descobrir processo usando a porta
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :5000
kill -9 <PID>

# Ou mudar a porta no .env
PORT=3001
```

### Problema: MongoDB não conecta

```bash
# Verificar se está rodando
# Windows: Services → MongoDB
# Linux/Mac:
sudo systemctl status mongod

# Iniciar se não estiver
sudo systemctl start mongod

# Verificar conexão
mongosh mongodb://localhost:27017/
```

### Problema: Erro de permissão (Linux/Mac)

```bash
# Dar permissão de execução
chmod +x node_modules/.bin/*

# Ou usar sudo (não recomendado)
sudo npm install
```

### Problema: Módulos não encontrados

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Python
pip cache purge
pip install -r requirements.txt --force-reinstall
```

### Problema: Build do Docker falha

```bash
# Limpar tudo
docker-compose down -v
docker system prune -af

# Rebuild sem cache
docker-compose build --no-cache
docker-compose up -d
```

---

## 📚 Dependências Detalhadas

### Backend (Node.js)

#### Produção (15 pacotes)
```json
{
  "@sentry/node": "^10.20.0",          // Monitoring
  "@sentry/profiling-node": "^10.20.0", // Profiling
  "axios": "^1.12.2",                   // HTTP client
  "bcrypt": "^5.1.1",                   // Password hashing
  "cors": "^2.8.5",                     // CORS middleware
  "dotenv": "^16.4.5",                  // Environment variables
  "express": "^4.19.2",                 // Web framework
  "express-rate-limit": "^8.1.0",       // Rate limiting
  "express-validator": "^7.2.1",        // Validation
  "helmet": "^8.1.0",                   // Security headers
  "ioredis": "^5.8.1",                  // Redis client
  "joi": "^18.0.1",                     // Validation schemas
  "jsonwebtoken": "^9.0.2",             // JWT
  "mongoose": "^8.4.0",                 // MongoDB ODM
  "morgan": "^1.10.1",                  // HTTP logging
  "multer": "^2.0.2",                   // File uploads
  "pdf-parse": "^2.3.11",               // PDF parsing
  "qrcode": "^1.5.4",                   // QR code generation
  "speakeasy": "^2.0.0",                // 2FA
  "winston": "^3.18.3"                  // Logging
}
```

#### Desenvolvimento (3 pacotes)
```json
{
  "jest": "^30.2.0",        // Testing
  "nodemon": "^3.1.0",      // Auto-reload
  "supertest": "^7.1.4"     // API testing
}
```

### Frontend (React)

#### Produção (7 pacotes)
```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-router-dom": "^6.23.1",
  "axios": "^1.7.2",
  "recharts": "^3.2.1",
  "react-webcam": "^7.2.0"
}
```

#### Desenvolvimento (4 pacotes)
```json
{
  "@vitejs/plugin-react": "^4.3.0",
  "vite": "^7.1.7",
  "eslint": "^9.2.0"
}
```

### ML API (Python)

```txt
fastapi==0.104.1
uvicorn==0.24.0
tensorflow==2.15.0
scikit-learn==1.3.2
numpy==1.24.3
pandas==2.0.3
motor==3.3.2
pydantic==2.5.0
python-dotenv==1.0.0
pytest==7.4.3           # Dev
pytest-cov==4.1.0       # Dev
```

---

## 🎯 Validação Completa

Execute estes comandos para validar a instalação:

```bash
# 1. Versões
node --version    # v20+
python --version  # 3.11+
docker --version  # 20.10+ (se usar Docker)

# 2. Serviços
mongosh           # Deve conectar
redis-cli ping    # Deve retornar PONG

# 3. Backend
cd server
npm test          # Deve passar

# 4. Frontend
cd client
npm run build     # Deve build sem erros

# 5. ML API
cd ml-api
pytest            # Deve passar (se tiver testes)

# 6. Docker (se usar)
docker-compose ps # Todos devem estar "Up"
```

---

## 📞 Suporte

**Problemas na instalação?**

1. Verifique os [logs](#verificação-da-instalação)
2. Consulte o [troubleshooting](#-troubleshooting)
3. Abra uma [issue](https://github.com/seu-usuario/SaveMyMoney/issues)
4. Entre em contato: seu-email@exemplo.com

**Documentação adicional:**
- [Quick Start](./QUICK_START.md)
- [README](./README.md)
- [Melhorias](./MELHORIAS_IMPLEMENTADAS.md)

---

**Boa instalação! 🚀**
