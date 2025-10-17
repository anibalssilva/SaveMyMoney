# 🚀 Guia Rápido de Deploy - Render.com

Este guia resolve os 2 problemas reportados:
1. ❌ Build do frontend falhando (Chart.js)
2. ❌ API ML não funcionando

## ✅ Problema 1: Build do Frontend - RESOLVIDO

### O que foi corrigido:
- ✅ Configurado `vite.config.js` para lidar com Chart.js corretamente
- ✅ Adicionado manual chunks e optimizeDeps
- ✅ Configurado CommonJS options

### O que fazer no Render:

1. **Acesse o Dashboard do Frontend**:
   - https://dashboard.render.com/
   - Encontre o serviço `savemymoney-frontend` (ou nome que você deu)

2. **Faça o Redeploy**:
   - Clique em **"Manual Deploy"** → **"Deploy latest commit"**
   - OU espere o auto-deploy após o push (já foi feito)

3. **Aguarde o Build**:
   - Tempo estimado: 3-5 minutos
   - Acompanhe os logs em tempo real
   - ✅ Build deve completar com sucesso agora

4. **Verifique**:
   - Acesse: `https://seu-app.onrender.com/financial-dashboard`
   - Os gráficos devem carregar sem erros

---

## ✅ Problema 2: API ML - Como Configurar

### Passo 1: Deploy da ML API (15 minutos)

#### 1.1 Criar Web Service

1. Acesse: https://dashboard.render.com/
2. Clique em **"New +"** → **"Web Service"**
3. Selecione seu repositório: `SaveMyMoney`
4. Configure:

```
Name: savemymoney-ml-api
Region: Oregon (US West)
Branch: main
Root Directory: ml-api
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### 1.2 Variáveis de Ambiente

Adicione estas variáveis no Render (aba "Environment"):

| Key | Value | Onde Copiar |
|-----|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://user:pass@...` | Do seu backend Node.js |
| `API_PORT` | `8000` | Apenas este valor |
| `NODE_API_URL` | `https://savemymoney-backend.onrender.com` | URL do seu backend |
| `SECRET_KEY` | Gere uma senha forte | https://randomkeygen.com/ |
| `PYTHON_VERSION` | `3.11.0` | Apenas este valor |

**💡 Dica**: Para copiar o `MONGODB_URI`:
1. Vá no seu backend Node.js no Render
2. Aba "Environment"
3. Copie o valor de `MONGO_URI` ou `MONGODB_URI`

#### 1.3 Criar o Serviço

1. Clique em **"Create Web Service"**
2. Aguarde 3-5 minutos
3. ✅ Quando terminar, você verá: **"Live"** (verde)

#### 1.4 Teste a ML API

```bash
# Substitua pela URL real
curl https://savemymoney-ml-api.onrender.com/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "service": "ml-api"
}
```

### Passo 2: Conectar Backend à ML API (2 minutos)

#### 2.1 Configurar Backend

1. Acesse o serviço backend no Render
2. Vá em **"Environment"**
3. Adicione ou edite:

```
ML_API_URL=https://savemymoney-ml-api.onrender.com
```

4. Clique em **"Save Changes"**
5. O backend fará redeploy automaticamente (1-2 min)

### Passo 3: Testar Previsões (1 minuto)

1. **Acesse o Frontend**:
   - https://seu-app.onrender.com/predictions

2. **Verifique o Status**:
   - Deve aparecer: **"API ML: Conectada ✅"** (verde)
   - Não deve mais aparecer: **"API ML: Desconectada ❌"**

3. **Teste uma Previsão**:
   - Selecione uma categoria
   - Escolha dias à frente (ex: 30)
   - Modelo: Regressão Linear
   - Clique em **"Gerar Previsão"**
   - ✅ Gráfico deve aparecer com previsões

---

## 🔍 Troubleshooting

### Problema: Build do Frontend ainda falha

**Sintomas**: Erro com Chart.js, rollup, ou import

**Solução**:
1. Confirme que o commit `cf4c5c5` foi deployado
2. No Render, vá em "Settings" → "Build & Deploy"
3. Clique em "Clear build cache & deploy"
4. Aguarde novo build

### Problema: ML API não conecta

**Sintomas**: "API ML: Desconectada" no frontend

**Checklist**:
- [ ] ML API está "Live" (verde) no Render?
- [ ] Health check responde? `curl https://sua-ml-api.onrender.com/health`
- [ ] Backend tem `ML_API_URL` configurado?
- [ ] URL está correta (sem barra no final)?

**Debug**:
1. Acesse os logs da ML API no Render
2. Procure por erros de conexão com MongoDB
3. Confirme que `MONGODB_URI` está correto

### Problema: Previsão retorna erro

**Sintomas**: Erro ao gerar previsão, mas API está conectada

**Possíveis Causas**:
1. **Sem dados suficientes**: Precisa ter pelo menos 7 transações
2. **MongoDB desconectado**: Verifique logs da ML API
3. **Timeout**: ML API no free tier "dorme" após 15 min

**Solução**:
1. Adicione mais transações: `/transactions` → "Adicionar Transação"
2. Verifique conexão MongoDB: Logs da ML API
3. Para evitar sleep: Use serviço de ping (ex: UptimeRobot)

### Problema: Gráficos não aparecem no Dashboard

**Sintomas**: Dashboard carrega mas sem gráficos

**Solução**:
1. Abra Console do navegador (F12)
2. Procure erros de JavaScript
3. Se houver erro de Chart.js:
   - Limpe cache do navegador (Ctrl+Shift+R)
   - Confirme que build foi feito com novo vite.config.js

---

## 📊 URLs Importantes

Após o deploy, você terá 3 serviços:

| Serviço | URL | Função |
|---------|-----|--------|
| **Frontend** | https://savemymoney-XXXX.onrender.com | Interface do usuário |
| **Backend** | https://savemymoney-backend-XXXX.onrender.com | API Node.js |
| **ML API** | https://savemymoney-ml-api-XXXX.onrender.com | Previsões ML |

**💡 Dica**: Salve essas URLs em um local seguro

---

## ✅ Checklist Final

### Frontend
- [ ] Build completa com sucesso
- [ ] Página inicial abre
- [ ] Login funciona
- [ ] Dashboard de Gráficos abre (`/financial-dashboard`)
- [ ] Gráficos são renderizados

### Backend
- [ ] Status "Live" (verde)
- [ ] Conectado ao MongoDB
- [ ] Variável `ML_API_URL` configurada

### ML API
- [ ] Status "Live" (verde)
- [ ] Health check responde
- [ ] Conectado ao MongoDB
- [ ] Aparece "Conectada" no frontend

### Previsões
- [ ] Página de Previsões abre (`/predictions`)
- [ ] Status mostra "API ML: Conectada ✅"
- [ ] Consegue gerar previsões
- [ ] Gráfico aparece com dados

---

## 🎯 Próximos Passos (Opcional)

### 1. Monitoramento
- Configure UptimeRobot para manter serviços ativos
- Configure alertas de downtime

### 2. Performance
- Upgrade para plano pago se necessário
- Configure CDN para frontend

### 3. Segurança
- Adicione domínio customizado
- Configure SSL/HTTPS (grátis no Render)
- Restrinja CORS para URLs específicas

---

## 📞 Suporte

Se ainda tiver problemas:

1. **Verifique Logs**:
   - Render Dashboard → Seu Serviço → Logs
   - Procure por erros em vermelho

2. **Teste Localmente**:
   ```bash
   # Frontend
   cd client
   npm run build
   npm run preview

   # Backend
   cd server
   npm start

   # ML API
   cd ml-api
   uvicorn app.main:app --reload
   ```

3. **Documentação**:
   - Veja `ML_API_SETUP.md` para detalhes da ML API
   - Veja `DEPLOY_RENDER.md` para deploy geral

---

**Status**: ✅ Correções aplicadas e commitadas
**Commit**: `cf4c5c5` - "fix: Resolve Chart.js build errors and ML API configuration"
**Data**: 2025-01-17

🚀 **Pronto para deploy!**
