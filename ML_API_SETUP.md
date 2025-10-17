# 🤖 ML API - Configuração e Deploy

Este documento explica como configurar e fazer deploy da API de Machine Learning para previsões financeiras.

## 📋 Pré-requisitos

- Python 3.10+
- MongoDB (local ou Atlas)
- Conta no Render.com (para deploy)

## 🚀 Setup Local

### 1. Instalar Dependências

```bash
cd ml-api
pip install -r requirements.txt
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `ml-api`:

```env
MONGODB_URI=mongodb://localhost:27017/savemymoney
API_PORT=8000
NODE_API_URL=http://localhost:5000
SECRET_KEY=your-secret-key-change-this
```

### 3. Iniciar o Servidor

```bash
# Opção 1: Usando uvicorn diretamente
python -m uvicorn app.main:app --reload --port 8000

# Opção 2: Usando o script main.py
python app/main.py
```

A API estará disponível em: `http://localhost:8000`

### 4. Testar a API

```bash
# Health check
curl http://localhost:8000/health

# Resposta esperada:
# {"status":"healthy","service":"ml-api"}
```

## 🌐 Deploy no Render.com

### Passo 1: Criar Web Service

1. Acesse [Render.com Dashboard](https://dashboard.render.com/)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `savemymoney-ml-api`
   - **Region**: `Oregon (US West)` (ou mais próximo)
   - **Branch**: `main`
   - **Root Directory**: `ml-api`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Passo 2: Configurar Variáveis de Ambiente

No painel do Render, adicione as seguintes variáveis:

| Key | Value | Descrição |
|-----|-------|-----------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/savemymoney` | MongoDB Atlas connection string |
| `API_PORT` | `8000` | Porta da API |
| `NODE_API_URL` | `https://savemymoney-backend.onrender.com` | URL do backend Node.js |
| `SECRET_KEY` | `[gere uma senha forte]` | Chave secreta para JWT |
| `PYTHON_VERSION` | `3.11.0` | Versão do Python |

### Passo 3: Atualizar Backend para Usar ML API

No backend Node.js (Render), adicione a variável:

```env
ML_API_URL=https://savemymoney-ml-api.onrender.com
```

### Passo 4: Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o deploy (3-5 minutos)
3. Teste a URL: `https://savemymoney-ml-api.onrender.com/health`

## 📊 Endpoints Disponíveis

### Health Check
```http
GET /health
```

**Resposta:**
```json
{
  "status": "healthy",
  "service": "ml-api"
}
```

### Fazer Previsão
```http
POST /api/predictions/predict
Content-Type: application/json
Authorization: Bearer {token}

{
  "user_id": "user123",
  "category": "Alimentação",
  "days_ahead": 30,
  "model_type": "linear"
}
```

**Resposta:**
```json
{
  "predictions": [12.5, 15.3, 18.2, ...],
  "dates": ["2025-01-01", "2025-01-02", ...],
  "confidence_interval": {
    "lower": [10.0, 12.0, ...],
    "upper": [15.0, 18.0, ...]
  },
  "model_type": "linear",
  "accuracy_score": 0.85
}
```

### Obter Insights
```http
GET /api/predictions/insights/{user_id}
Authorization: Bearer {token}
```

### Previsão por Categoria
```http
GET /api/predictions/category/{user_id}/{category}?days_ahead=30
Authorization: Bearer {token}
```

### Comparar Previsões
```http
GET /api/predictions/compare/{user_id}
Authorization: Bearer {token}
```

## 🔧 Modelos de ML Disponíveis

### 1. Regressão Linear (`linear`)
- **Uso**: Tendências lineares simples
- **Vantagens**: Rápido, leve, interpretável
- **Melhor para**: Dados com padrões lineares claros
- **Precisão**: 70-80%

### 2. LSTM (`lstm`)
- **Uso**: Padrões complexos e sazonalidade
- **Vantagens**: Alta precisão, captura dependências temporais
- **Melhor para**: Dados históricos extensos (>100 registros)
- **Precisão**: 80-90%
- **Nota**: Requer mais memória e tempo de processamento

## 🐛 Troubleshooting

### Erro: "API ML: Desconectada"

**Causa**: ML API não está rodando ou URL incorreta

**Solução**:
1. Verifique se a ML API está rodando: `curl http://localhost:8000/health`
2. Confirme a variável `ML_API_URL` no backend
3. Verifique logs do Render para erros

### Erro: "Connection refused"

**Causa**: MongoDB não está acessível

**Solução**:
1. Verifique o `MONGODB_URI` no .env
2. Confirme que o MongoDB Atlas permite conexões do IP do Render
3. Teste a conexão com: `mongosh "mongodb+srv://..."`

### Erro: "Module not found"

**Causa**: Dependências não instaladas

**Solução**:
```bash
cd ml-api
pip install -r requirements.txt --force-reinstall
```

### Deploy falha no Render

**Causa**: Configuração incorreta

**Solução**:
1. Confirme que o `Root Directory` é `ml-api`
2. Verifique o Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Confirme que `requirements.txt` existe em `ml-api/`
4. Verifique logs de build no Render

## 🧪 Testando Localmente

### 1. Com dados reais

```python
import requests

# Health check
response = requests.get("http://localhost:8000/health")
print(response.json())

# Fazer previsão
payload = {
    "user_id": "user123",
    "category": "Alimentação",
    "days_ahead": 7,
    "model_type": "linear"
}

headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}

response = requests.post(
    "http://localhost:8000/api/predictions/predict",
    json=payload,
    headers=headers
)

print(response.json())
```

### 2. Com curl

```bash
# Health check
curl http://localhost:8000/health

# Previsão
curl -X POST http://localhost:8000/api/predictions/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": "user123",
    "category": "Alimentação",
    "days_ahead": 30,
    "model_type": "linear"
  }'
```

## 📦 Estrutura do Projeto

```
ml-api/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Configurações
│   ├── database.py          # MongoDB connection
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── linear_predictor.py   # Regressão Linear
│   │   └── lstm_predictor.py     # LSTM
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py       # Pydantic models
│   └── routers/
│       ├── __init__.py
│       └── predictions.py   # Endpoints
├── requirements.txt         # Dependências Python
├── .env                     # Variáveis de ambiente (não commitado)
└── README.md
```

## 🔐 Segurança

### Produção

1. **Use HTTPS**: Configure certificado SSL no Render
2. **Restrinja CORS**: Remova `"*"` e liste apenas origens específicas
3. **JWT Validation**: Valide tokens do backend Node.js
4. **Rate Limiting**: Implemente limitação de requisições
5. **Secrets**: Use variáveis de ambiente do Render (nunca commite .env)

### Exemplo de CORS restrito:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://savemymoney-frontend.onrender.com",
        "https://savemymoney-backend.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
```

## 📈 Performance

### Otimizações

1. **Cache de Modelos**: Modelos treinados são salvos em memória
2. **Connection Pooling**: MongoDB usa pool de conexões
3. **Async Operations**: FastAPI é totalmente assíncrono
4. **Lazy Loading**: Modelos são carregados sob demanda

### Limites Render Free Tier

- **Memória**: 512 MB
- **CPU**: Compartilhado
- **Sleep**: Após 15 min de inatividade
- **Bandwidth**: 100 GB/mês

**Dica**: Use um cron job para manter a API ativa:
```bash
# No crontab ou serviço externo
*/10 * * * * curl https://savemymoney-ml-api.onrender.com/health
```

## 📚 Recursos Adicionais

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [TensorFlow/Keras Guide](https://www.tensorflow.org/guide/keras)
- [scikit-learn](https://scikit-learn.org/stable/)
- [Render Python Docs](https://render.com/docs/deploy-fastapi)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs: `Render Dashboard → Logs`
2. Teste localmente primeiro
3. Confirme variáveis de ambiente
4. Verifique conectividade com MongoDB

---

**Status**: ✅ Pronto para deploy
**Última atualização**: 2025-01-17
