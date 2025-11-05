# 🚀 Quick Start - Gráficos Dinâmicos

## 📍 Como Acessar

### Localmente (Desenvolvimento)

1. **Inicie o Streamlit:**
```bash
cd streamlit_app
pip install -r requirements.txt
streamlit run app.py
```

2. **Abra no navegador:**
- Direto: http://localhost:8501
- Ou clique no menu da aplicação React: **"📊 Gráficos Dinâmicos ↗"**

### Em Produção (Depois do Deploy)

- Acesse via menu do SaveMyMoney
- Ou direto pela URL: `https://seu-app-streamlit.onrender.com`

---

## 🌐 Deploy Rápido no Render

### 1️⃣ Criar Web Service

1. Acesse: https://dashboard.render.com/
2. **New +** → **Web Service**
3. Conecte seu repositório GitHub

### 2️⃣ Configurar

**Configurações:**
```
Name: savemymoney-streamlit
Region: Oregon (US West)
Branch: main
Root Directory: streamlit_app
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: streamlit run app.py --server.port=$PORT --server.address=0.0.0.0 --server.headless=true
Instance Type: Free
```

### 3️⃣ Variáveis de Ambiente

Adicione no Render:
```
MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/savemymoney
```

### 4️⃣ Deploy

- Clique em **"Create Web Service"**
- Aguarde 2-5 minutos
- Pronto! 🎉

### 5️⃣ Atualizar Frontend

Edite `client/.env`:
```env
VITE_STREAMLIT_URL=https://savemymoney-streamlit.onrender.com
```

Commit e push:
```bash
git add client/.env
git commit -m "chore: atualizar URL do Streamlit para produção"
git push
```

---

## 🎨 Recursos Disponíveis

### Filtros
- ✅ Tipo (Receita/Despesa)
- ✅ Categorias
- ✅ Subcategorias
- ✅ Métodos de Pagamento
- ✅ Período (Data/Mês/Intervalo)

### Gráficos (10 tipos)
1. Barras - Categorias
2. Barras - Subcategorias
3. Barras - Período
4. Linhas - Evolução
5. Pizza - Categoria
6. Pizza - Subcategoria
7. Scatter - Dispersão
8. Funil - Categorias
9. Treemap - Hierarquia
10. Heatmap - Dia/Mês

### Extras
- 📊 Métricas em tempo real
- 📋 Tabela de dados
- 📥 Download CSV

---

## 🐛 Problemas Comuns

### Streamlit não abre

**Solução:**
```bash
# Verifique se está na pasta correta
cd streamlit_app

# Reinstale dependências
pip install -r requirements.txt --force-reinstall

# Rode novamente
streamlit run app.py
```

### Não conecta no MongoDB

**Solução:**
1. Verifique se MongoDB está rodando
2. Confira a variável `MONGO_URI` no `.env`
3. Teste a conexão:
```bash
mongosh "mongodb://localhost:27017/savemymoney"
```

### Deploy no Render falha

**Checklist:**
- [ ] Root Directory: `streamlit_app`
- [ ] Start Command correto (com `--server.port=$PORT`)
- [ ] `MONGO_URI` configurada
- [ ] MongoDB Atlas permite IP `0.0.0.0/0`

---

## 📚 Documentação Completa

- **Guia Deploy:** [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
- **Funcionalidades:** [README.md](./README.md)
- **Documentação Geral:** [../README.md](../README.md)

---

## 💡 Dicas

### Melhor Performance
```python
# Ajuste o cache no app.py:
@st.cache_data(ttl=300)  # 5 minutos
```

### Tema Customizado
Crie `.streamlit/config.toml`:
```toml
[theme]
primaryColor = "#00f0ff"
backgroundColor = "#0f0f23"
secondaryBackgroundColor = "#1a1a2e"
```

### Autenticação
Use `streamlit-authenticator` para proteger com senha

---

**Pronto para usar! 🚀**

Se tiver dúvidas, consulte o [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) completo.
