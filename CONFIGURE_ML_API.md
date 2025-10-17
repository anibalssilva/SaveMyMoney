# 🤖 Como Configurar a API ML no Render

Este guia mostra como resolver o erro **"API ML: Desconectada"**.

## 🎯 Problema

A aplicação mostra que a API ML está desconectada porque:
1. A ML API não está deployada no Render, OU
2. A variável `ML_API_URL` não está configurada no backend

---

## ✅ Solução Rápida (Opção 1): Desabilitar ML API Temporariamente

Se você não quer usar as previsões ML agora, pode desabilitá-la:

### No Backend (Render)

Adicione esta variável de ambiente:
```
ML_API_URL=disabled
```

Isso fará com que o sistema não tente conectar à ML API.

---

## 🚀 Solução Completa (Opção 2): Deploy da ML API

Se você quer usar as previsões ML, siga estes passos:

### Passo 1: Criar Serviço da ML API no Render

1. **Acesse**: https://dashboard.render.com/
2. **Clique**: "New +" → "Web Service"
3. **Selecione**: Seu repositório `SaveMyMoney`
4. **Configure**:

   ```
   Name: savemymoney-ml-api
   Region: Oregon (US West) ou mais próximo
   Branch: main
   Root Directory: ml-api
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

5. **Clique**: "Create Web Service"

### Passo 2: Configurar Variáveis de Ambiente da ML API

No serviço `savemymoney-ml-api`, adicione estas variáveis:

| Variable | Value | Onde Copiar |
|----------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://user:pass@...` | Copie do backend Node.js |
| `API_PORT` | `8000` | Apenas digite 8000 |
| `NODE_API_URL` | `https://savemymoney-backend-XXXX.onrender.com` | URL do seu backend |
| `SECRET_KEY` | `gere-uma-senha-forte-aqui` | https://randomkeygen.com/ |
| `PYTHON_VERSION` | `3.11.0` | Apenas digite 3.11.0 |

**💡 Dica**: Para copiar `MONGODB_URI`:
1. Vá no serviço backend Node.js
2. Aba "Environment"
3. Procure por `MONGO_URI` ou `MONGODB_URI`
4. Copie o valor completo

### Passo 3: Aguardar Deploy

- Tempo estimado: 3-5 minutos
- Aguarde até aparecer: **"Live"** (verde)
- URL será algo como: `https://savemymoney-ml-api-XXXX.onrender.com`

### Passo 4: Testar ML API

```bash
# Substitua pela sua URL real
curl https://savemymoney-ml-api-XXXX.onrender.com/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "service": "ml-api"
}
```

### Passo 5: Conectar Backend à ML API

1. **Vá no serviço backend** (`SaveMyMoney-backend`)
2. **Aba "Environment"**
3. **Adicione ou edite**:

   ```
   ML_API_URL=https://savemymoney-ml-api-XXXX.onrender.com
   ```

   ⚠️ **IMPORTANTE**:
   - Substitua `XXXX` pela URL real da sua ML API
   - NÃO adicione barra `/` no final
   - Use HTTPS, não HTTP

4. **Clique**: "Save Changes"
5. Aguarde redeploy automático (1-2 minutos)

### Passo 6: Verificar Conexão

1. **Acesse**: `https://seu-app.onrender.com/predictions`
2. **Verifique**: Status deve mudar para **"API ML: Conectada ✅"**
3. **Teste**: Tente gerar uma previsão

---

## 🔍 Troubleshooting

### Problema: "API ML: Desconectada" mesmo após configurar

**Checklist**:
1. ✅ ML API está "Live" (verde) no Render?
2. ✅ Health check funciona? `curl https://sua-ml-api/health`
3. ✅ Backend tem `ML_API_URL` configurado?
4. ✅ URL está correta (sem barra no final)?
5. ✅ Backend fez redeploy após adicionar variável?

**Debug**:
```bash
# Acesse logs do backend no Render
# Procure por: "🤖 ML API configured: ..."
# Deve mostrar a URL da ML API
```

### Problema: ML API não faz deploy

**Erro Comum**: `requirements.txt not found`

**Solução**:
1. Confirme que "Root Directory" é `ml-api`
2. Verifique se `ml-api/requirements.txt` existe no GitHub

**Erro Comum**: `Port $PORT not found`

**Solução**:
- Start Command deve ser: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- NÃO use `--port 8000`

### Problema: ML API retorna erro 500

**Causa**: MongoDB não conectou

**Solução**:
1. Verifique `MONGODB_URI` na ML API
2. Teste conexão: Logs da ML API devem mostrar "Connected to MongoDB"
3. Confirme que MongoDB Atlas permite conexão do IP do Render

---

## 📋 Checklist Final

### ML API
- [ ] Serviço criado no Render
- [ ] Root Directory = `ml-api`
- [ ] Start Command correto
- [ ] Variáveis de ambiente configuradas
- [ ] Status "Live" (verde)
- [ ] Health check responde

### Backend
- [ ] Variável `ML_API_URL` adicionada
- [ ] URL sem barra no final
- [ ] Redeploy completo
- [ ] Logs mostram: "🤖 ML API configured: ..."

### Frontend
- [ ] Página /predictions abre
- [ ] Status mostra "Conectada ✅"
- [ ] Consegue gerar previsões

---

## 🎯 Comandos de Teste

### Testar ML API Diretamente
```bash
# Health check
curl https://sua-ml-api.onrender.com/health

# Root endpoint
curl https://sua-ml-api.onrender.com/
```

### Testar via Backend
```bash
# Health check através do backend
curl https://seu-backend.onrender.com/api/predictions/health
```

### Testar no Navegador
```javascript
// Abra Console (F12) na página /predictions
fetch('/api/predictions/health')
  .then(r => r.json())
  .then(console.log)
```

---

## 🔧 Configuração do Backend no Render

Baseado na imagem que você mostrou, veja se está assim:

### Environment Variables (Backend)
```bash
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=sua-secret-key
CLIENT_URL=https://seu-frontend.onrender.com
FRONTEND_URL=https://seu-frontend.onrender.com

# 👇 ADICIONE ESTA:
ML_API_URL=https://savemymoney-ml-api-XXXX.onrender.com
```

### Start Command (Backend)
```bash
npm start && python -m uvicorn app.main:app --reload --port 8000
```

❌ **ERRADO!** Não misture Node.js com Python no mesmo comando!

✅ **CORRETO**:
```bash
npm start
```

O Python deve rodar em um serviço SEPARADO (a ML API).

---

## 📞 Ainda com Problemas?

1. **Verifique Logs**:
   - Render Dashboard → ML API → Logs
   - Render Dashboard → Backend → Logs

2. **Teste Localmente**:
   ```bash
   # ML API
   cd ml-api
   uvicorn app.main:app --reload

   # Backend
   cd server
   ML_API_URL=http://localhost:8000 npm start
   ```

3. **Confirme Estrutura**:
   ```
   SaveMyMoney/
   ├── ml-api/
   │   ├── app/
   │   │   └── main.py
   │   ├── requirements.txt
   │   └── README.md
   └── server/
       └── routes/
           └── api/
               └── predictions.js
   ```

---

## 🎉 Resultado Esperado

Após seguir todos os passos:

1. **ML API**: Status "Live" no Render
2. **Backend**: Logs mostram conexão à ML API
3. **Frontend**:
   - ✅ Status: "API ML: Conectada"
   - Botão "Gerar Previsão" funciona
   - Gráfico aparece com dados

---

**Última atualização**: 2025-01-17
**Versão**: 1.0
