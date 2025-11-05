# 🔧 Configurar URL do Streamlit no Frontend (Render)

## ❌ Problema Atual:

O botão "Gráficos Dinâmicos" está tentando abrir `http://localhost:8501`, mas deveria abrir a URL de produção do Render.

**Erro:** "This site can't be reached - localhost refused to connect"

---

## ✅ Solução: Configurar Variável de Ambiente no Render

### Passo 1: Acessar Dashboard do Frontend no Render

1. Acesse: https://dashboard.render.com/
2. Selecione o serviço **frontend** (Static Site)
3. Clique em **"Environment"** no menu lateral

### Passo 2: Adicionar Variável de Ambiente

Clique em **"Add Environment Variable"** e adicione:

```
Key: VITE_STREAMLIT_URL
Value: https://savemymoney-streamlit.onrender.com
```

### Passo 3: Fazer Redeploy

1. Clique em **"Save Changes"**
2. O Render fará **redeploy automático**
3. Aguarde ~2-3 minutos

---

## 🎯 Resultado Esperado:

Após o redeploy, o botão "Gráficos Dinâmicos" abrirá:
```
https://savemymoney-streamlit.onrender.com
```

Em vez de:
```
http://localhost:8501 ❌
```

---

## 📋 Verificação:

### Como Testar:

1. Acesse sua aplicação: `https://seu-frontend.onrender.com`
2. Faça login
3. Clique em **"📊 Gráficos Dinâmicos"**
4. Deve abrir o Streamlit corretamente ✅

### Se não funcionar:

1. Verifique se a variável foi salva:
   - Render Dashboard → Frontend → Environment
   - Deve aparecer: `VITE_STREAMLIT_URL = https://savemymoney-streamlit.onrender.com`

2. Force um rebuild:
   - Render Dashboard → Frontend → Manual Deploy
   - Selecione **"Clear build cache & deploy"**

3. Verifique se o Streamlit está online:
   - Abra diretamente: https://savemymoney-streamlit.onrender.com
   - Se não carregar, o problema está no deploy do Streamlit (veja seção abaixo)

---

## 🐛 Troubleshooting: Streamlit não Carrega

### Problema 1: Streamlit não fez deploy ainda

**Sintomas:**
- URL do Streamlit retorna 404 ou erro
- Build logs mostram erro

**Solução:**
Consulte os guias de deploy do Streamlit:
- [RENDER_QUICK_FIX.md](streamlit_app/RENDER_QUICK_FIX.md)
- [PYTHON_VERSION_FIX.md](streamlit_app/PYTHON_VERSION_FIX.md)

**Configuração necessária no serviço Streamlit:**
```
Root Directory: streamlit_app
Build Command: pip install -r requirements.txt
Start Command: streamlit run app.py --server.port=$PORT --server.address=0.0.0.0 --server.headless=true
Environment Variable: MONGO_URI=mongodb+srv://...
```

### Problema 2: Free Tier Hibernando

**Sintomas:**
- Primeiro acesso demora 30-60 segundos
- Depois de inatividade, volta a demorar

**Explicação:**
O plano Free do Render hiberna após 15 minutos de inatividade.

**Soluções:**
1. Aceitar o comportamento (gratuito)
2. Upgrade para plano pago ($7/mês - sem hibernação)
3. Usar serviço de keep-alive (UptimeRobot)

---

## 📸 Visual da Configuração

### Render Dashboard → Frontend → Environment:

```
┌─────────────────────────────────────────────────┐
│ Environment Variables                           │
├─────────────────────────────────────────────────┤
│ Key                    │ Value                  │
├────────────────────────┼────────────────────────┤
│ VITE_API_URL          │ https://...backend...  │
│ VITE_STREAMLIT_URL    │ https://...streamlit...│ ← ADICIONAR ESTA!
└─────────────────────────────────────────────────┘

[Add Environment Variable]
[Save Changes]
```

---

## 🔄 Alternativa: Desenvolvimento Local

Se quiser testar localmente primeiro:

### 1. Criar arquivo `.env` no frontend:

```bash
cd client
echo VITE_STREAMLIT_URL=http://localhost:8501 > .env
```

### 2. Iniciar Streamlit localmente:

```bash
cd streamlit_app
streamlit run app.py
```

### 3. Iniciar frontend:

```bash
cd client
npm run dev
```

Agora o botão funcionará localmente!

---

## ✅ Checklist Completo:

Para produção:
- [ ] Variável `VITE_STREAMLIT_URL` adicionada no Render (frontend)
- [ ] Valor: `https://savemymoney-streamlit.onrender.com`
- [ ] Redeploy do frontend completado
- [ ] Streamlit deployado e funcionando
- [ ] Botão testado e abrindo URL correta

Para desenvolvimento local:
- [ ] Arquivo `streamlit_app/.env` criado
- [ ] Streamlit rodando em `localhost:8501`
- [ ] Frontend rodando em `localhost:5173`
- [ ] Botão testado localmente

---

## 💡 Dica Pro:

Depois de configurar, você pode verificar no navegador:

**Abra o DevTools (F12) → Console:**

```javascript
// Verifique qual URL está sendo usada
console.log(import.meta.env.VITE_STREAMLIT_URL)

// Deve mostrar: https://savemymoney-streamlit.onrender.com
```

---

**Configuração correta = Botão funcionando! 🎉**
