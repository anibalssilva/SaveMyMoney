# 🔧 Instruções para Iniciar MongoDB e Criar Usuário Admin

## ❌ Problema Identificado

O erro "Invalid Credentials" ocorre porque:
1. **MongoDB não está rodando** - O servidor precisa estar ativo
2. **Usuário admin não foi criado** - Não existe no banco de dados ainda

## ✅ Solução: 3 Opções

---

### 🐳 OPÇÃO 1: Usar Docker (Recomendado - Mais Fácil)

Se você tem Docker instalado, esta é a forma mais rápida:

#### Passo 1: Iniciar MongoDB com Docker Compose

```bash
# No diretório raiz do projeto
docker-compose up -d mongodb
```

#### Passo 2: Verificar se MongoDB está rodando

```bash
docker ps
```

Você deve ver algo como:
```
CONTAINER ID   IMAGE       STATUS          PORTS
xxx...         mongo:8     Up 10 seconds   0.0.0.0:27017->27017/tcp
```

#### Passo 3: Criar o usuário admin

```bash
cd server
npm run seed:admin
```

#### Passo 4: Testar o login

Acesse: http://localhost:5173/login

- **Email:** admin@savemymoney.com
- **Senha:** admin@123

---

### 💻 OPÇÃO 2: MongoDB Instalado Localmente (Windows)

Se você já tem MongoDB instalado no Windows:

#### Passo 1: Iniciar o serviço MongoDB

**Opção A - Via Serviços do Windows:**
1. Pressione `Win + R`
2. Digite `services.msc` e Enter
3. Procure por "MongoDB"
4. Clique direito → "Iniciar"

**Opção B - Via Command Prompt (Admin):**
```cmd
net start MongoDB
```

**Opção C - Executar mongod manualmente:**
```cmd
# Crie um diretório para dados se não existir
mkdir C:\data\db

# Inicie o MongoDB
mongod --dbpath C:\data\db
```

#### Passo 2: Verificar conexão

Abra outro terminal e teste:
```bash
mongosh
```

Se conectar, o MongoDB está rodando! Digite `exit` para sair.

#### Passo 3: Criar o usuário admin

```bash
cd server
npm run seed:admin
```

Você verá:
```
✅ ========================================
✅ Admin user created successfully!
✅ ========================================

📧 Email: admin@savemymoney.com
🔑 Password: admin@123

🔗 Login at: http://localhost:5173/login

🧪 Password test: ✅ PASSED
```

---

### 🛠️ OPÇÃO 3: Instalação Manual do MongoDB (Se não tiver instalado)

#### Windows:

1. **Baixar MongoDB:**
   - Acesse: https://www.mongodb.com/try/download/community
   - Selecione versão: Windows / MSI
   - Baixe e instale

2. **Durante instalação:**
   - Marque "Install MongoDB as a Service"
   - Use configurações padrão

3. **Após instalação:**
   - MongoDB já estará rodando como serviço
   - Vá para OPÇÃO 2, Passo 3

#### Linux/Mac:

```bash
# Ubuntu/Debian
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Mac (Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

---

## 🔍 Verificação e Troubleshooting

### ✅ Como verificar se MongoDB está rodando:

**Windows:**
```cmd
tasklist | findstr mongod
```

**Linux/Mac:**
```bash
ps aux | grep mongod
```

**Usando mongosh:**
```bash
mongosh mongodb://localhost:27017
```

Se conectar = MongoDB está rodando ✅

### ❌ Se o script de criação falhar:

**Método Manual - Inserir admin direto no MongoDB:**

1. Execute o gerador de hash:
```bash
cd server
node scripts/generateAdminHash.js
```

2. Copie o comando MongoDB gerado (começando com `db.users.insertOne(...)`)

3. Conecte ao MongoDB:
```bash
mongosh mongodb://localhost:27017/savemymoney
```

4. Cole o comando copiado e pressione Enter

5. Verifique se foi criado:
```javascript
db.users.findOne({ email: "admin@savemymoney.com" })
```

Você deve ver o documento do usuário com todos os campos.

---

## 🚀 Testando o Sistema Completo

### 1. Inicie todos os serviços:

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

Deve mostrar:
```
✅ Server started on port 5000
✅ MongoDB connected successfully
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

Deve mostrar:
```
➜  Local:   http://localhost:5173/
```

### 2. Acesse a aplicação:

http://localhost:5173/login

### 3. Faça login:

- **Email:** admin@savemymoney.com
- **Senha:** admin@123

### 4. Se funcionar:

✅ Você será redirecionado para `/dashboard`
✅ Verá suas informações no canto superior direito
✅ Poderá criar transações, orçamentos, etc.

---

## 📊 Status dos Serviços

Para verificar se tudo está funcionando:

| Serviço | URL | Status Esperado |
|---------|-----|----------------|
| Frontend | http://localhost:5173 | ✅ Página de login carrega |
| Backend | http://localhost:5000/api/health | ✅ Retorna JSON com status |
| MongoDB | mongodb://localhost:27017 | ✅ Aceita conexão |

---

## 🆘 Problemas Comuns

### Problema: "MongoNetworkError: connect ECONNREFUSED"
**Solução:** MongoDB não está rodando → Siga OPÇÃO 1 ou 2

### Problema: "Invalid Credentials" após criar admin
**Solução:**
1. Verifique se o script rodou com sucesso (mostrou "✅ PASSED")
2. Verifique no MongoDB se o usuário existe:
   ```bash
   mongosh mongodb://localhost:27017/savemymoney
   db.users.findOne({ email: "admin@savemymoney.com" })
   ```

### Problema: "Falha ao carregar cotações" (banner vermelho)
**Solução:** Esse problema foi CORRIGIDO!
- O Market Ticker agora não mostra erro
- Se a API Brapi estiver indisponível, o componente simplesmente não aparece
- Isso não afeta o funcionamento principal da aplicação

### Problema: Porta 27017 já em uso
**Solução:** Outro processo está usando MongoDB
```bash
# Windows
netstat -ano | findstr :27017
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:27017 | xargs kill -9
```

### Problema: Porta 5000 ou 5173 já em uso
**Solução:** Mude as portas nos arquivos .env ou pare o processo:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

---

## 📝 Próximos Passos

Após fazer login com sucesso:

1. ✅ Explore o Dashboard
2. ✅ Crie uma transação de teste
3. ✅ Configure um orçamento
4. ✅ Teste as previsões de IA
5. ✅ Ative o modo escuro (botão no canto superior)
6. ✅ Experimente a instalação PWA (se disponível)

---

## 🔐 Segurança

⚠️ **IMPORTANTE:**

Este usuário admin é APENAS PARA TESTES EM DESENVOLVIMENTO!

Antes de produção:
- [ ] Mude a senha do admin
- [ ] Crie seu próprio usuário via registro
- [ ] Delete ou desabilite admin@savemymoney.com
- [ ] Configure variáveis de ambiente adequadas
- [ ] Use senhas fortes e únicas

---

## 📞 Suporte

Se ainda tiver problemas:

1. Verifique os logs do backend (terminal onde rodou `npm start`)
2. Abra o Console do navegador (F12) e veja erros
3. Verifique se todas as dependências foram instaladas:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

---

**Última atualização:** 2025-10-16
**Versão:** 2.0.0
