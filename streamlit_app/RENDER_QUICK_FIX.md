# ⚡ CORREÇÃO RÁPIDA - Deploy Streamlit no Render

## ❌ Erro Atual

```bash
cd streamlit && pip install -r requirements.txt
bash: line 1: cd: streamlit: No such file or directory
==> Build failed 😞
```

## 🔥 SOLUÇÃO IMEDIATA

O Build Command está com o nome da pasta errado!

### No Dashboard do Render:

1. **Acesse:** https://dashboard.render.com/
2. **Selecione** seu serviço Streamlit
3. **Clique em "Settings"**
4. **Procure por "Build Command"**

### ❌ ERRADO (Atual):
```bash
cd streamlit && pip install -r requirements.txt
```

### ✅ CORRETO (Mudar para):

**Opção A - Com Root Directory configurado:**
```bash
pip install -r requirements.txt
```

**Opção B - Sem Root Directory:**
```bash
cd streamlit_app && pip install -r requirements.txt
```

---

## 📋 CONFIGURAÇÕES COMPLETAS CORRETAS

### Configuração Recomendada:

```
Name: savemymoney-streamlit
Region: Oregon (US West)
Branch: main
Root Directory: streamlit_app          ← Configure isso PRIMEIRO!

Runtime: Python 3

Build Command:
pip install -r requirements.txt         ← SEM cd!

Start Command:
streamlit run app.py --server.port=$PORT --server.address=0.0.0.0 --server.headless=true

Instance Type: Free
```

### Environment Variables:
```
MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/savemymoney?retryWrites=true&w=majority
```

---

## 🎯 PASSO A PASSO EXATO

### 1️⃣ Configure Root Directory

- **Settings** → Procure por **"Root Directory"**
- Digite: `streamlit_app`
- **Save Changes**

### 2️⃣ Corrija o Build Command

- **Settings** → Procure por **"Build Command"**
- Apague o comando atual
- Digite: `pip install -r requirements.txt`
- **Save Changes**

### 3️⃣ Verifique o Start Command

- **Settings** → Procure por **"Start Command"**
- Deve estar: `streamlit run app.py --server.port=$PORT --server.address=0.0.0.0 --server.headless=true`
- Se estiver diferente, corrija
- **Save Changes**

### 4️⃣ Adicione MONGO_URI

- **Settings** → **Environment**
- **Add Environment Variable**
- Key: `MONGO_URI`
- Value: sua connection string do MongoDB

### 5️⃣ Deploy

- Volte para a aba **"Logs"**
- Clique em **"Manual Deploy"**
- Selecione **"Clear build cache & deploy"**
- Aguarde 2-5 minutos

---

## ✅ Resultado Esperado nos Logs:

```
==> Checking out commit...
==> Using Python version 3.9
==> Running build command 'pip install -r requirements.txt'...
Collecting streamlit==1.31.1
Collecting pymongo==4.6.1
Collecting pandas==2.2.0
Collecting plotly==5.18.0
...
Successfully installed streamlit-1.31.1 pymongo-4.6.1 pandas-2.2.0 plotly-5.18.0
==> Build successful 🎉
==> Starting service...
==> Service is live 🎉
```

---

## 🔍 CHECKLIST RÁPIDO

Antes de fazer deploy, verifique:

- [ ] **Root Directory:** `streamlit_app` (COM underscore, SEM barra final)
- [ ] **Build Command:** `pip install -r requirements.txt` (SEM cd)
- [ ] **Start Command:** `streamlit run app.py --server.port=$PORT --server.address=0.0.0.0 --server.headless=true`
- [ ] **Runtime:** Python 3
- [ ] **Environment Variable:** `MONGO_URI` configurada
- [ ] **MongoDB Atlas:** Network Access permite `0.0.0.0/0`

---

## 🚨 ERROS COMUNS

### Erro: "No such file or directory: streamlit"
**Causa:** Build Command com `cd streamlit`
**Fix:** Remova o `cd` e configure Root Directory

### Erro: "No such file or directory: requirements.txt"
**Causa:** Root Directory não configurado
**Fix:** Configure Root Directory para `streamlit_app`

### Erro: "Please provide a port number"
**Causa:** Start Command sem `--server.port=$PORT`
**Fix:** Adicione `--server.port=$PORT` no Start Command

---

## 💡 DICA PRO

Se nada funcionar, **delete o serviço** e crie novamente do zero com as configurações corretas desde o início:

1. Settings → Delete Web Service
2. New + → Web Service
3. Configure tudo de uma vez seguindo este guia
4. Deploy!

---

## 📸 VISUAL DAS CONFIGURAÇÕES

```
┌─────────────────────────────────────────┐
│ Settings                                │
├─────────────────────────────────────────┤
│ Name: savemymoney-streamlit             │
│ Region: Oregon (US West)                │
│ Branch: main                            │
│                                         │
│ Root Directory: streamlit_app    ← FIX! │
│                                         │
│ Runtime: Python 3                       │
│                                         │
│ Build Command:                          │
│ pip install -r requirements.txt  ← FIX! │
│                                         │
│ Start Command:                          │
│ streamlit run app.py             ← OK!  │
│ --server.port=$PORT                     │
│ --server.address=0.0.0.0                │
│ --server.headless=true                  │
│                                         │
│ [Save Changes]                          │
└─────────────────────────────────────────┘
```

---

**Faça essas mudanças e o deploy funcionará! 🚀**

URL final: `https://savemymoney-streamlit.onrender.com`
