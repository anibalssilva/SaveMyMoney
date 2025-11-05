# 🔧 Fix: Deploy do Streamlit no Render

## ❌ Erro Comum

```
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'
==> Build failed 😞
```

## ✅ Solução

O problema ocorre porque o Render está tentando executar `pip install -r requirements.txt` na raiz do projeto, mas o arquivo está em `streamlit_app/requirements.txt`.

### Opção 1: Configurar Root Directory (RECOMENDADO)

#### No Dashboard do Render:

1. **Acesse seu serviço Streamlit** no Render
2. Vá em **"Settings"**
3. Procure por **"Root Directory"**
4. **IMPORTANTE:** Digite exatamente: `streamlit_app`
5. Clique em **"Save Changes"**
6. Faça um **"Manual Deploy"** → **"Clear build cache & deploy"**

#### Configurações Completas:

```
Name: savemymoney-streamlit
Region: Oregon (US West)
Branch: main

✅ Root Directory: streamlit_app  ← CRÍTICO!

Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: streamlit run app.py --server.port=$PORT --server.address=0.0.0.0 --server.headless=true

Instance Type: Free
```

### Opção 2: Blueprint YAML (Alternativa)

Se a Opção 1 não funcionar, use um arquivo `render.yaml`:

**Já criado em:** `streamlit_app/render.yaml`

#### Como usar:

1. **Commit e push** o arquivo `render.yaml`
2. No Render, **delete o serviço antigo**
3. Crie um **novo serviço** usando **"Blueprint"**
4. Selecione o repositório
5. O Render detectará automaticamente o `render.yaml`
6. Adicione a variável `MONGO_URI` manualmente
7. Deploy!

---

## 📋 Checklist Completo

Antes de fazer deploy, verifique:

### 1. Estrutura de Arquivos

```
SaveMyMoney/
└── streamlit_app/          ← Esta pasta deve existir
    ├── app.py              ✅
    ├── requirements.txt    ✅
    ├── .env.example        ✅
    └── README.md           ✅
```

Verifique localmente:
```bash
ls streamlit_app/
# Deve listar: app.py, requirements.txt, etc.
```

### 2. Configurações do Render

- [ ] **Root Directory:** `streamlit_app` (SEM barra no final!)
- [ ] **Build Command:** `pip install -r requirements.txt`
- [ ] **Start Command:** `streamlit run app.py --server.port=$PORT --server.address=0.0.0.0 --server.headless=true`
- [ ] **Runtime:** Python 3
- [ ] **Python Version:** 3.9 ou superior

### 3. Variáveis de Ambiente

No Render → Environment:

```
MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/savemymoney?retryWrites=true&w=majority
```

### 4. MongoDB Atlas

- [ ] Network Access permite IP `0.0.0.0/0` ou IPs do Render
- [ ] Database user criado com permissões corretas
- [ ] Connection string testada

---

## 🔍 Debug: Verificar Logs

Se o deploy falhar:

1. Acesse o serviço no Render
2. Clique na aba **"Logs"**
3. Procure por:

### Erro: requirements.txt não encontrado
```
ERROR: Could not open requirements file
```
**Solução:** Configure `Root Directory: streamlit_app`

### Erro: Módulo não encontrado
```
ModuleNotFoundError: No module named 'streamlit'
```
**Solução:**
- Verifique se `requirements.txt` existe
- Force rebuild: "Clear build cache & deploy"

### Erro: Porta não especificada
```
streamlit run app.py
Please provide a port number with --server.port
```
**Solução:** Start Command deve incluir `--server.port=$PORT`

### Erro: MongoDB connection
```
ServerSelectionTimeoutError: No servers are available
```
**Solução:**
- Verifique `MONGO_URI` no Environment
- Configure Network Access no MongoDB Atlas

---

## 🚀 Comandos Corretos

### Build Command:
```bash
pip install -r requirements.txt
```

### Start Command (Uma linha):
```bash
streamlit run app.py --server.port=$PORT --server.address=0.0.0.0 --server.headless=true --server.enableCORS=false --server.enableXsrfProtection=false
```

**Flags importantes:**
- `--server.port=$PORT`: Usa a porta dinâmica do Render
- `--server.address=0.0.0.0`: Aceita conexões externas
- `--server.headless=true`: Modo produção (não abre browser)
- `--server.enableCORS=false`: Desabilita verificação CORS
- `--server.enableXsrfProtection=false`: Desabilita XSRF (seguro no Render)

---

## 🔄 Passo a Passo Completo (Do Zero)

### 1. Deletar Serviço Antigo (se necessário)

No Render:
1. Acesse o serviço problemático
2. Settings → **"Delete Web Service"**
3. Confirme

### 2. Criar Novo Serviço

1. Dashboard → **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub
3. Selecione o repositório `SaveMyMoney`

### 3. Configurar

**Configurações:**
```
Name: savemymoney-streamlit
Region: Oregon (US West)
Branch: main
Root Directory: streamlit_app    ← IMPORTANTE!
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: streamlit run app.py --server.port=$PORT --server.address=0.0.0.0 --server.headless=true
Instance Type: Free
```

### 4. Adicionar Variável de Ambiente

Clique em **"Advanced"** → **"Add Environment Variable"**

```
Key: MONGO_URI
Value: mongodb+srv://...
```

### 5. Deploy

1. Clique em **"Create Web Service"**
2. Aguarde 2-5 minutos
3. Verifique logs em tempo real

### 6. Testar

Após deploy bem-sucedido:
```
https://savemymoney-streamlit.onrender.com
```

Deve carregar a aplicação Streamlit! 🎉

---

## 💡 Dicas

### Desenvolvimento Local

Sempre teste localmente antes de fazer deploy:

```bash
cd streamlit_app
pip install -r requirements.txt
streamlit run app.py
```

Se funciona local, deve funcionar no Render (com as configurações corretas).

### Forçar Rebuild

Se mudou dependências:

1. Settings → **"Clear build cache"**
2. Clique em **"Manual Deploy"**
3. Selecione **"Clear build cache & deploy"**

### Verificar Python Version

No Render, você pode especificar a versão do Python:

**Opção 1:** Criar `runtime.txt` em `streamlit_app/`:
```
python-3.9.18
```

**Opção 2:** Adicionar variável de ambiente:
```
PYTHON_VERSION=3.9.18
```

---

## 📞 Ainda com Problemas?

1. **Consulte os logs** no Render
2. **Verifique a estrutura** do repositório no GitHub
3. **Compare** com as configurações deste guia
4. **Teste localmente** primeiro

---

## ✅ Resultado Esperado

**Logs de sucesso:**
```
==> Downloading cache...
==> Installing dependencies...
Successfully installed streamlit-1.31.1 pymongo-4.6.1 pandas-2.2.0 plotly-5.18.0
==> Build successful 🎉
==> Starting service with 'streamlit run app.py...'

You can now view your Streamlit app in your browser.

Network URL: http://0.0.0.0:10000
```

**URL funcional:**
`https://savemymoney-streamlit.onrender.com` ✅

---

**Última atualização:** 2025-11-05
