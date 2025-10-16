# 🔐 Credenciais de Teste - SaveMyMoney

## Usuário Admin Padrão

Para facilitar os testes, foi criado um usuário administrador padrão no sistema.

### 📧 Credenciais

```
Email: admin@savemymoney.com
Senha: admin@123
```

---

## 🚀 Como Criar o Usuário Admin

### ⚠️ PRIMEIRO: MongoDB Precisa Estar Rodando!

**Se você recebeu erro "Invalid Credentials" ou "MongoNetworkError":**

👉 **Siga o guia completo:** [INSTRUCOES_MONGODB.md](./INSTRUCOES_MONGODB.md)

Este documento possui 3 opções detalhadas para iniciar MongoDB:
- Opção 1: Docker Compose (mais fácil)
- Opção 2: MongoDB local no Windows
- Opção 3: Instalação do zero

**Quick Start (se já tem MongoDB instalado):**

```bash
# Opção A: Docker
docker-compose up -d mongodb

# Opção B: Windows Service
net start MongoDB

# Opção C: Manual
mongod --dbpath C:\data\db
```

---

### Opção 1: Script Automático (Recomendado)

**Pré-requisito:** MongoDB precisa estar rodando!

```bash
cd server
npm run seed:admin
```

Este script irá:
- ✅ Conectar ao MongoDB
- ✅ Remover admin antigo (se existir)
- ✅ Criar novo usuário admin com senha hashada
- ✅ Testar a senha
- ✅ Exibir confirmação

**Saída esperada:**
```
Connecting to MongoDB...
✅ Connected!
🗑️  Removed old admin (if existed)
🔒 Password hashed

✅ ========================================
✅ Admin user created successfully!
✅ ========================================

📧 Email: admin@savemymoney.com
🔑 Password: admin@123

🔗 Login at: http://localhost:5173/login

🧪 Password test: ✅ PASSED
```

**Se der erro de timeout:**
→ MongoDB não está rodando! Veja [INSTRUCOES_MONGODB.md](./INSTRUCOES_MONGODB.md)

---

### Opção 2: Inserção Manual (Se script falhar)

**Passo 1:** Gere o hash da senha

```bash
cd server
node scripts/generateAdminHash.js
```

**Passo 2:** Copie o comando `db.users.insertOne(...)` gerado

**Passo 3:** Conecte ao MongoDB e execute

```bash
mongosh mongodb://localhost:27017/savemymoney
# Cole o comando e pressione Enter
```

**Passo 4:** Verifique se foi criado

```javascript
db.users.findOne({ email: "admin@savemymoney.com" })
```

Deve retornar o documento do usuário.

---

## 🧪 Testando o Sistema

### 1. Registro de Novo Usuário

**Endpoint:** `POST /api/auth/register`

**Payload:**
```json
{
  "name": "Seu Nome",
  "email": "seu.email@exemplo.com",
  "password": "senha123"
}
```

**Validações:**
- ✅ Nome: mínimo 2 caracteres, máximo 50
- ✅ Email: formato válido (user@domain.com)
- ✅ Senha: mínimo 6 caracteres

**Resposta de Sucesso:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Seu Nome",
    "email": "seu.email@exemplo.com"
  },
  "message": "Cadastro realizado com sucesso!"
}
```

**Erros Possíveis:**
```json
// Email já cadastrado
{
  "error": "Este email já está cadastrado. Por favor, faça login ou use outro email.",
  "field": "email"
}

// Validação falhou
{
  "error": "Nome é obrigatório",
  "errors": [...]
}
```

### 2. Login de Usuário

**Endpoint:** `POST /api/auth/login`

**Payload:**
```json
{
  "email": "admin@savemymoney.com",
  "password": "admin@123"
}
```

**Resposta de Sucesso:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Administrator",
    "email": "admin@savemymoney.com",
    "twoFactorEnabled": false
  },
  "message": "Login realizado com sucesso!"
}
```

**Erros Possíveis:**
```json
// Credenciais inválidas
{
  "error": "Email ou senha incorretos",
  "field": "password"
}
```

### 3. Testando com cURL

```bash
# Registro
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Usuario",
    "email": "teste@example.com",
    "password": "senha123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@savemymoney.com",
    "password": "admin@123"
  }'

# Usar token nas requests
curl -X GET http://localhost:5000/api/transactions \
  -H "x-auth-token: SEU_TOKEN_AQUI"
```

### 4. Testando no Frontend

1. **Acesse:** http://localhost:5173 (ou porta configurada)

2. **Registre-se:**
   - Clique em "Register"
   - Preencha o formulário
   - Clique em "Register"

3. **Faça Login:**
   - Use: admin@savemymoney.com
   - Senha: admin@123
   - Clique em "Login"

4. **Navegue:**
   - Dashboard: /dashboard
   - Transações: /transactions
   - Orçamentos: /budgets
   - etc.

---

## 🔒 Segurança

### ⚠️ IMPORTANTE

**Para Produção:**

1. **NUNCA use a senha padrão `admin@123` em produção!**

2. **Mude a senha imediatamente após o primeiro login:**
   ```bash
   # Futuro endpoint
   POST /api/auth/change-password
   {
     "currentPassword": "admin@123",
     "newPassword": "SuaSenhaSuperSegura123!@#"
   }
   ```

3. **Considere ativar 2FA para a conta admin:**
   ```bash
   POST /api/2fa/setup
   # Retorna QR code
   ```

4. **Altere o JWT_SECRET no .env:**
   ```env
   JWT_SECRET=seu_secret_production_super_complexo_aqui
   ```

5. **Use senha forte:**
   - Mínimo 12 caracteres
   - Combinação de maiúsculas, minúsculas, números e símbolos
   - Não use palavras de dicionário
   - Não reutilize senhas

### Checklist de Segurança

- [ ] Mudar senha padrão do admin
- [ ] Atualizar JWT_SECRET
- [ ] Ativar 2FA (opcional)
- [ ] Configurar rate limiting (já implementado)
- [ ] Ativar HTTPS em produção
- [ ] Configurar firewall
- [ ] Manter dependências atualizadas

---

## 🧪 Casos de Teste

### Teste 1: Registro com Email Duplicado

**Passos:**
1. Registre usuário: teste@example.com
2. Tente registrar novamente com mesmo email
3. Deve retornar erro: "Este email já está cadastrado"

**Resultado Esperado:** ❌ Erro 400

### Teste 2: Senha Fraca

**Passos:**
1. Tente registrar com senha "123"
2. Deve retornar erro de validação

**Resultado Esperado:** ❌ Erro 400

### Teste 3: Login Incorreto

**Passos:**
1. Login com senha errada
2. Deve retornar "Email ou senha incorretos"

**Resultado Esperado:** ❌ Erro 400

### Teste 4: Login Correto

**Passos:**
1. Login com credenciais corretas
2. Deve retornar token JWT válido

**Resultado Esperado:** ✅ Sucesso 200

### Teste 5: Acesso a Rota Protegida

**Passos:**
1. Acesse /api/transactions sem token
2. Deve retornar erro 401

**Resultado Esperado:** ❌ Não autorizado

### Teste 6: Acesso com Token Válido

**Passos:**
1. Login e obter token
2. Use token para acessar /api/transactions
3. Deve retornar lista de transações

**Resultado Esperado:** ✅ Sucesso 200

---

## 📊 Dados de Teste Adicionais

### Transações de Exemplo

```json
[
  {
    "description": "Salário",
    "amount": 5000,
    "date": "2025-10-01",
    "category": "Salário",
    "type": "income"
  },
  {
    "description": "Supermercado",
    "amount": 350,
    "date": "2025-10-15",
    "category": "Alimentação",
    "type": "expense"
  },
  {
    "description": "Conta de Luz",
    "amount": 180,
    "date": "2025-10-10",
    "category": "Moradia",
    "type": "expense"
  }
]
```

### Orçamentos de Exemplo

```json
[
  {
    "category": "Alimentação",
    "limit": 800,
    "warningThreshold": 80,
    "period": "monthly"
  },
  {
    "category": "Transporte",
    "limit": 300,
    "warningThreshold": 75,
    "period": "monthly"
  }
]
```

---

## 🐛 Troubleshooting

### Problema: "Failed to register. User may already exist."

**Solução:**
- Verifique se o email já está cadastrado
- Tente com outro email
- Ou faça login se já tem conta

### Problema: "Email ou senha incorretos"

**Solução:**
- Verifique se digitou corretamente
- Email é case-insensitive (admin@savemymoney.com = ADMIN@savemymoney.com)
- Senha é case-sensitive (admin@123 ≠ Admin@123)

### Problema: "Erro no servidor"

**Solução:**
- Verifique se MongoDB está rodando
- Verifique logs do servidor: `cd server && npm run dev`
- Verifique conexão com banco

### Problema: Token expirado

**Solução:**
- Faça login novamente
- Token tem validade de 100 horas
- Limpe localStorage e faça novo login

---

## 📞 Suporte

**Documentação:**
- [README.md](./README.md)
- [QUICK_START.md](./QUICK_START.md)
- [MELHORIAS_IMPLEMENTADAS.md](./MELHORIAS_IMPLEMENTADAS.md)

**Problemas:**
- GitHub Issues: https://github.com/seu-usuario/SaveMyMoney/issues

---

**Última atualização:** 2025-10-15
**Versão:** 2.0.0
