# ⚙️ Configuração de Variáveis de Ambiente no Render (Frontend)

## 📝 Variáveis Necessárias

Adicione as seguintes variáveis de ambiente no dashboard do Render para o serviço **frontend** (Static Site):

### 1. API Backend

```
VITE_API_URL=https://savemymoney-backend.onrender.com
```

### 2. Streamlit App (Gráficos Dinâmicos)

```
VITE_STREAMLIT_URL=https://savemymoney-streamlit.onrender.com
```

### 3. App Configuration (Opcional)

```
VITE_APP_NAME=SaveMyMoney
VITE_APP_VERSION=2.0.0
VITE_ENABLE_PWA=true
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_2FA=true
```

---

## 🔧 Como Configurar no Render

### Passo a Passo:

1. **Acesse o Dashboard do Render:**
   - Vá em: https://dashboard.render.com/
   - Selecione seu serviço **frontend** (Static Site)

2. **Navegue até Environment:**
   - No menu lateral, clique em **"Environment"**

3. **Adicione as Variáveis:**
   - Clique em **"Add Environment Variable"**
   - Copie e cole cada variável (key e value)
   - Clique em **"Save Changes"**

4. **Redeploy:**
   - As mudanças nas variáveis de ambiente requerem um redeploy
   - Clique em **"Manual Deploy"** → **"Deploy latest commit"**
   - Ou faça um novo commit e push para trigger automático

---

## ✅ Verificação

Após o deploy, verifique se o link "Gráficos Dinâmicos" no menu está funcionando:

1. Acesse sua aplicação: `https://seu-frontend.onrender.com`
2. Faça login
3. Clique em **"📊 Gráficos Dinâmicos"** no menu
4. Deve abrir: `https://savemymoney-streamlit.onrender.com`

---

## 🐛 Troubleshooting

### Link está indo para localhost

**Problema:** O botão está abrindo `http://localhost:8501`

**Causa:** Variável `VITE_STREAMLIT_URL` não foi configurada no Render

**Solução:**
1. Adicione a variável no Render (Environment)
2. Faça redeploy do frontend

### Variável não está sendo reconhecida

**Importante:** No Vite, variáveis de ambiente devem ter o prefixo `VITE_`

**Correto:**
```
VITE_STREAMLIT_URL=https://...
```

**Errado:**
```
STREAMLIT_URL=https://...  # Não vai funcionar!
```

### Preciso testar localmente

Crie um arquivo `.env` na pasta `client/`:

```bash
cd client
cp .env.example .env
```

Edite o `.env` conforme necessário:
```env
VITE_API_URL=http://localhost:5000
VITE_STREAMLIT_URL=http://localhost:8501
```

**Nota:** O arquivo `.env` não deve ser commitado (já está no `.gitignore`)

---

## 📚 Referências

- **Vite Environment Variables:** https://vitejs.dev/guide/env-and-mode.html
- **Render Environment Variables:** https://render.com/docs/environment-variables

---

**Última atualização:** 2025-11-05
