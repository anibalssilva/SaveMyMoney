# 🚀 Guia de Integração e Deploy - Streamlit App

## 📱 Como Acessar Dentro da Aplicação React

A aplicação Streamlit roda separadamente do React, mas você pode integrá-la de algumas formas:

### Opção 1: Link Externo no Menu (Recomendado)

Adicione um link no menu de navegação da aplicação React que abre o Streamlit em nova aba.

**1. Edite o arquivo de navegação/sidebar:**

```jsx
// client/src/components/Navbar.jsx ou similar
<nav>
  <Link to="/">Dashboard</Link>
  <Link to="/transactions">Transações</Link>
  <Link to="/financial-dashboard">Evolução Financeira</Link>

  {/* Novo link para Streamlit */}
  <a
    href="http://localhost:8501"
    target="_blank"
    rel="noopener noreferrer"
    className="nav-link"
  >
    📊 Gráficos Dinâmicos
  </a>
</nav>
```

**2. Em produção, use a URL do deploy:**

```jsx
<a
  href="https://savemymoney-streamlit.onrender.com"
  target="_blank"
  rel="noopener noreferrer"
  className="nav-link"
>
  📊 Gráficos Dinâmicos
</a>
```

### Opção 2: Iframe Embutido (Menos recomendado)

Crie uma nova página React que renderiza o Streamlit em iframe:

```jsx
// client/src/pages/StreamlitDashboardPage.jsx
import React from 'react';

const StreamlitDashboardPage = () => {
  const streamlitUrl = process.env.NODE_ENV === 'production'
    ? 'https://savemymoney-streamlit.onrender.com'
    : 'http://localhost:8501';

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <iframe
        src={streamlitUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        title="Gráficos Dinâmicos"
      />
    </div>
  );
};

export default StreamlitDashboardPage;
```

**Adicione a rota:**

```jsx
// client/src/App.jsx
import StreamlitDashboardPage from './pages/StreamlitDashboardPage';

<Routes>
  <Route path="/graficos-dinamicos" element={<StreamlitDashboardPage />} />
</Routes>
```

**Nota:** O iframe pode ter problemas de autenticação e cors. A Opção 1 é mais simples e confiável.

---

## 🌐 Deploy no Render

O Streamlit precisa ser deployado separadamente do backend Node.js. Você terá **3 serviços** no Render:

1. **Frontend React** (Static Site)
2. **Backend Node.js** (Web Service)
3. **Streamlit App** (Web Service) ← Novo

### Passo 1: Preparar o Repositório

O código já está pronto! A pasta `streamlit_app/` contém tudo que é necessário.

### Passo 2: Criar Novo Web Service no Render

1. Acesse https://dashboard.render.com/
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub

### Passo 3: Configurar o Serviço

**Build & Deploy:**

| Campo | Valor |
|-------|-------|
| **Name** | `savemymoney-streamlit` (ou outro nome) |
| **Region** | `Oregon (US West)` |
| **Branch** | `main` |
| **Root Directory** | `streamlit_app` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `streamlit run app.py --server.port=$PORT --server.address=0.0.0.0 --server.headless=true` |
| **Instance Type** | `Free` |

### Passo 4: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente no Render:

| Key | Value |
|-----|-------|
| `MONGO_URI` | Sua connection string do MongoDB Atlas (mesma do backend) |

**Exemplo:**
```
MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/savemymoney?retryWrites=true&w=majority
```

### Passo 5: Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build (2-5 minutos)
3. O Streamlit estará disponível em: `https://savemymoney-streamlit.onrender.com`

### Passo 6: Atualizar a Aplicação React

Depois do deploy, atualize o link no frontend React:

```jsx
// client/src/components/Navbar.jsx
<a
  href="https://savemymoney-streamlit.onrender.com"
  target="_blank"
  rel="noopener noreferrer"
>
  📊 Gráficos Dinâmicos
</a>
```

---

## 🔧 Troubleshooting

### Problema: Aplicação não inicia

**Erro comum:**
```
ERROR: Could not find a version that satisfies the requirement...
```

**Solução:**
- Verifique se o Python 3.9+ está sendo usado
- No Render, vá em Settings → Python Version → Selecione `3.9` ou superior

### Problema: Conexão com MongoDB falha

**Erro:**
```
ServerSelectionTimeoutError: No servers are available
```

**Solução:**
1. Verifique se `MONGO_URI` está configurada corretamente
2. No MongoDB Atlas:
   - Vá em "Network Access"
   - Adicione IP `0.0.0.0/0` (permitir todos os IPs)
   - Ou adicione os IPs do Render

### Problema: Streamlit não carrega corretamente

**Solução:**
Certifique-se de que o Start Command está correto:
```bash
streamlit run app.py --server.port=$PORT --server.address=0.0.0.0 --server.headless=true
```

Os parâmetros importantes:
- `--server.port=$PORT`: Usa a porta dinâmica do Render
- `--server.address=0.0.0.0`: Permite conexões externas
- `--server.headless=true`: Modo produção (sem browser automático)

### Problema: Aplicação hiberna (Free tier)

O plano gratuito do Render hiberna após 15 minutos de inatividade.

**Soluções:**
1. **Aceitar o comportamento:** Primeiro acesso demora ~30s para "acordar"
2. **Upgrade para plano pago:** $7/mês por serviço (sem hibernação)
3. **Keep-alive externo:** Use um serviço como UptimeRobot para pingar a URL a cada 5 minutos

---

## 🎨 Customização

### Alterar Tema do Streamlit

Crie o arquivo `streamlit_app/.streamlit/config.toml`:

```toml
[theme]
primaryColor = "#00f0ff"
backgroundColor = "#0f0f23"
secondaryBackgroundColor = "#1a1a2e"
textColor = "#ffffff"
font = "sans serif"

[server]
headless = true
port = 8501
```

**Commit e redeploy:**
```bash
git add streamlit_app/.streamlit/config.toml
git commit -m "feat: adicionar tema customizado ao Streamlit"
git push
```

### Adicionar Autenticação

Para proteger a aplicação com senha, instale `streamlit-authenticator`:

```bash
pip install streamlit-authenticator
```

Adicione no `app.py`:

```python
import streamlit_authenticator as stauth

# Configuração de usuários
credentials = {
    'usernames': {
        'admin': {
            'name': 'Admin',
            'password': 'hashed_password_aqui'  # Use bcrypt
        }
    }
}

authenticator = stauth.Authenticate(
    credentials,
    'cookie_name',
    'signature_key',
    cookie_expiry_days=30
)

name, authentication_status, username = authenticator.login('Login', 'main')

if authentication_status:
    # Código da aplicação aqui
    st.title("📊 Gráficos Dinâmicos")
    # ...
elif authentication_status == False:
    st.error('Username/password is incorrect')
elif authentication_status == None:
    st.warning('Please enter your username and password')
```

---

## 📊 Monitoramento

### Logs no Render

1. Acesse o dashboard do serviço Streamlit
2. Clique na aba **"Logs"**
3. Visualize logs em tempo real

### Métricas

O Render fornece métricas básicas:
- CPU usage
- Memory usage
- Request count
- Response times

Acesse em: Dashboard → Seu Serviço → Metrics

---

## 💡 Dicas de Performance

### 1. Cache de Dados

O app já usa `@st.cache_data(ttl=60)` para cachear dados do MongoDB.

Ajuste o TTL se necessário:
```python
@st.cache_data(ttl=300)  # 5 minutos
def load_data():
    # ...
```

### 2. Limitar Dados

Para grandes volumes de dados, adicione limite:

```python
# Carregar apenas últimos 1000 registros
transactions = list(db.transactions.find().sort('date', -1).limit(1000))
```

### 3. Paginação

Para tabelas grandes, use paginação:

```python
page_size = 100
page_number = st.number_input('Página', min_value=1, value=1)
start_idx = (page_number - 1) * page_size
end_idx = start_idx + page_size

st.dataframe(df.iloc[start_idx:end_idx])
```

---

## 🔐 Segurança

### Proteger Variáveis de Ambiente

Nunca commite arquivos `.env` com credenciais!

**.gitignore já inclui:**
```
.env
*.env
```

### MongoDB Atlas

Configure corretamente:
1. **Network Access**: Permitir IPs do Render ou `0.0.0.0/0`
2. **Database User**: Use senha forte
3. **Connection String**: Use URI com SSL (`retryWrites=true&w=majority`)

### CORS (se necessário)

Se usar autenticação compartilhada com o backend, configure CORS:

```python
# Não necessário para app standalone
# Mas se integrar autenticação:
st.set_page_config(
    page_title="...",
    page_icon="...",
    initial_sidebar_state="expanded",
    menu_items={
        'Get Help': 'https://seu-site.com/help',
        'Report a bug': "https://seu-site.com/bug",
        'About': "# SaveMyMoney - Gráficos Dinâmicos"
    }
)
```

---

## 📚 Recursos Adicionais

- **Documentação Streamlit:** https://docs.streamlit.io
- **Deploy Guide Oficial:** https://docs.streamlit.io/streamlit-community-cloud/get-started/deploy-an-app
- **Plotly Docs:** https://plotly.com/python/
- **Render Docs:** https://render.com/docs

---

## ✅ Checklist de Deploy

- [ ] Código commitado e pushed para GitHub
- [ ] Variável `MONGO_URI` configurada no Render
- [ ] Start Command correto: `streamlit run app.py --server.port=$PORT --server.address=0.0.0.0 --server.headless=true`
- [ ] Root Directory: `streamlit_app`
- [ ] MongoDB Atlas permite acesso do Render (Network Access)
- [ ] Build bem-sucedido no Render
- [ ] Aplicação acessível via URL do Render
- [ ] Link atualizado no frontend React
- [ ] Testado com dados reais do MongoDB

---

**Dúvidas?** Consulte a documentação ou abra uma issue no GitHub.

**Desenvolvido com ❤️ para SaveMyMoney**
