# SaveMyMoney - ML API

API de Machine Learning para previsão de gastos futuros usando Regressão Linear e LSTM.

## 🚀 Tecnologias

- **FastAPI**: Framework web moderno e rápido
- **TensorFlow/Keras**: Deep Learning para modelo LSTM
- **Scikit-learn**: Machine Learning clássico (Regressão Linear)
- **MongoDB**: Banco de dados (via Motor async driver)
- **NumPy & Pandas**: Processamento de dados
- **Uvicorn**: Servidor ASGI de alta performance

## 📋 Pré-requisitos

- Python 3.9 ou superior
- MongoDB rodando (mesma instância do backend Node.js)
- 2GB+ de RAM (recomendado para LSTM)

## 🔧 Instalação

### 1. Criar ambiente virtual

```bash
cd ml-api
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e ajuste as configurações:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/savemymoney
API_PORT=8000
NODE_API_URL=http://localhost:5000
SECRET_KEY=your-secret-key-here
```

### 4. Iniciar o servidor

```bash
# Modo desenvolvimento (com auto-reload)
python -m uvicorn app.main:app --reload --port 8000

# Ou usando o script principal
python -m app.main
```

A API estará disponível em: `http://localhost:8000`

## 📊 Modelos Implementados

### 1. Regressão Linear

**Características:**
- Rápido e eficiente
- Funciona com poucos dados (mínimo 2 pontos)
- Ideal para tendências lineares
- Baixo uso de memória

**Quando usar:**
- Dados históricos limitados
- Padrões de gasto estáveis
- Necessidade de respostas rápidas

### 2. LSTM (Long Short-Term Memory)

**Características:**
- Rede neural recorrente
- Captura padrões complexos e sazonalidade
- Requer mais dados (mínimo 8 dias)
- Maior acurácia para padrões não-lineares

**Quando usar:**
- Dados históricos abundantes (15+ dias)
- Padrões de gasto complexos
- Sazonalidade nos gastos

## 🔌 Endpoints da API

### Health Check

```http
GET /health
```

Verifica o status da API.

**Resposta:**
```json
{
  "status": "healthy",
  "service": "ml-api"
}
```

### Gerar Previsão

```http
POST /api/predictions/predict
```

**Body:**
```json
{
  "user_id": "user_mongodb_id",
  "category": "Alimentação",  // opcional, null para todas
  "days_ahead": 30,
  "model_type": "linear"  // "linear" ou "lstm"
}
```

**Resposta:**
```json
{
  "user_id": "user_mongodb_id",
  "category": "Alimentação",
  "predictions": [
    {
      "date": "2025-11-01",
      "predicted_amount": 150.50,
      "confidence_lower": 120.30,
      "confidence_upper": 180.70
    }
  ],
  "model_type": "linear",
  "accuracy_score": 0.85,
  "total_predicted": 4515.00,
  "avg_daily_spending": 150.50,
  "trend": "increasing",
  "created_at": "2025-10-15T10:30:00"
}
```

### Insights por Categoria

```http
GET /api/predictions/insights/{user_id}?days_ahead=30
```

Retorna análises de todas as categorias.

**Resposta:**
```json
{
  "user_id": "user_mongodb_id",
  "total_predicted_spending": 15000.00,
  "categories": [
    {
      "category": "Alimentação",
      "current_avg": 150.00,
      "predicted_avg": 165.50,
      "trend": "increasing",
      "recommendation": "Seus gastos nesta categoria estão aumentando..."
    }
  ],
  "overall_trend": "increasing",
  "created_at": "2025-10-15T10:30:00"
}
```

### Previsão por Categoria

```http
GET /api/predictions/category/{user_id}/{category}?days_ahead=30&model_type=linear
```

### Comparar Modelos

```http
GET /api/predictions/compare/{user_id}?days_ahead=30
```

Compara resultados de ambos os modelos (Linear e LSTM).

## 🧪 Testando a API

### Usando cURL

```bash
# Health check
curl http://localhost:8000/health

# Previsão com regressão linear
curl -X POST http://localhost:8000/api/predictions/predict \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "507f1f77bcf86cd799439011",
    "days_ahead": 30,
    "model_type": "linear"
  }'

# Insights
curl http://localhost:8000/api/predictions/insights/507f1f77bcf86cd799439011?days_ahead=30
```

### Usando a documentação interativa

Acesse: `http://localhost:8000/docs`

FastAPI gera automaticamente uma documentação Swagger UI interativa.

## 📁 Estrutura do Projeto

```
ml-api/
├── app/
│   ├── __init__.py
│   ├── main.py              # Aplicação FastAPI principal
│   ├── config.py            # Configurações
│   ├── database.py          # Conexão MongoDB
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── linear_predictor.py   # Modelo Linear
│   │   └── lstm_predictor.py     # Modelo LSTM
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py       # Pydantic schemas
│   └── routers/
│       ├── __init__.py
│       └── predictions.py   # Rotas da API
├── requirements.txt
├── .env.example
└── README.md
```

## 🔬 Como os Modelos Funcionam

### Regressão Linear

1. **Preparação de dados**: Agrupa transações por dia
2. **Feature engineering**: Calcula dias desde primeira transação
3. **Treinamento**: Ajusta linha de regressão aos dados históricos
4. **Previsão**: Extrapola a linha para dias futuros
5. **Intervalo de confiança**: Calculado usando desvio padrão dos resíduos

### LSTM

1. **Preparação de dados**: Cria série temporal diária (preenche gaps com 0)
2. **Normalização**: Usa MinMaxScaler para valores entre 0 e 1
3. **Sequências**: Cria janelas de 7 dias (lookback)
4. **Arquitetura**:
   - 2 camadas LSTM (50 unidades cada)
   - Dropout (0.2) para evitar overfitting
   - Camadas densas para output
5. **Treinamento**: 50 épocas com early stopping
6. **Previsão**: Predição recursiva (usa predição anterior)

## ⚙️ Configuração Avançada

### Ajustar Hiperparâmetros do LSTM

Edite `app/ml/lstm_predictor.py`:

```python
# Alterar lookback (padrão: 7 dias)
predictor = LSTMPredictor(lookback=14)

# Alterar épocas de treinamento
history = self.model.fit(X, y, epochs=100, ...)
```

### Ajustar Intervalos de Confiança

Em ambos os modelos, o intervalo usa 95% (1.96 * std_error).

Para alterar para 90%:
```python
confidence_lower = pred - 1.645 * std_error
confidence_upper = pred + 1.645 * std_error
```

## 🐛 Troubleshooting

### Erro: TensorFlow not available

Se o LSTM não funcionar:

```bash
pip install tensorflow==2.15.0
```

Para versões com GPU:
```bash
pip install tensorflow[and-cuda]
```

### Erro: MongoDB connection failed

Verifique:
1. MongoDB está rodando
2. URI está correta no `.env`
3. Banco de dados `savemymoney` existe

### Erro: Not enough data

Os modelos precisam de dados mínimos:
- Linear: 2+ dias de dados
- LSTM: 8+ dias de dados

## 📈 Performance

### Benchmarks

Testado com Intel i5, 8GB RAM:

| Modelo | Tempo (30 dias) | Memória |
|--------|----------------|---------|
| Linear | ~50ms | ~20MB |
| LSTM | ~500ms | ~200MB |

### Otimização

Para produção:
1. Cache de modelos treinados
2. Batch predictions
3. GPU para LSTM (speedup 10x)

## 🔒 Segurança

- A API não implementa autenticação própria
- Autenticação é gerenciada pelo backend Node.js
- Use HTTPS em produção
- Valide user_id no Node.js antes de chamar ML API

## 🚀 Deploy

### Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Heroku

```bash
# Criar Procfile
echo "web: uvicorn app.main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Deploy
git push heroku main
```

## 📝 Licença

MIT

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📧 Suporte

Para problemas ou dúvidas, abra uma issue no GitHub.
