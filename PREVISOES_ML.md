# Sistema de Previsões com Machine Learning

## 📊 Visão Geral

Sistema completo de previsão de gastos utilizando Machine Learning, com dois modelos diferentes:
- **Regressão Linear**: Para tendências simples e dados limitados
- **LSTM (Deep Learning)**: Para padrões complexos e maior acurácia

## 🏗️ Arquitetura

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend  │◄────►│   Node.js    │◄────►│  FastAPI ML  │
│   (React)   │      │   (Express)  │      │   (Python)   │
└─────────────┘      └──────────────┘      └──────────────┘
                            │                      │
                            ▼                      ▼
                     ┌──────────────────────────────┐
                     │        MongoDB               │
                     └──────────────────────────────┘
```

## 📁 Estrutura de Arquivos Criados

### Backend (Node.js)
```
server/routes/api/
└── predictions.js           # Proxy para ML API
```

### ML API (Python/FastAPI)
```
ml-api/
├── app/
│   ├── main.py             # Aplicação principal
│   ├── config.py           # Configurações
│   ├── database.py         # MongoDB async
│   ├── ml/
│   │   ├── linear_predictor.py    # Regressão Linear
│   │   └── lstm_predictor.py      # LSTM Neural Network
│   ├── models/
│   │   └── schemas.py      # Pydantic models
│   └── routers/
│       └── predictions.py  # API endpoints
├── requirements.txt
├── .env.example
└── README.md
```

### Frontend (React)
```
client/src/
├── components/
│   ├── PredictionChart.jsx        # Gráfico de previsões
│   └── PredictionChart.css
└── pages/
    ├── PredictionsPage.jsx        # Página principal
    └── PredictionsPage.css
```

## 🚀 Instalação e Execução

### 1. Instalar ML API

```bash
cd ml-api

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente (Windows)
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Configurar .env
cp .env.example .env

# Iniciar servidor
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Instalar dependência no Node.js

```bash
cd server
npm install axios
```

### 3. Instalar biblioteca de gráficos no Frontend

```bash
cd client
npm install recharts
```

### 4. Configurar variável de ambiente

No arquivo `server/.env`, adicione:

```env
ML_API_URL=http://localhost:8000
```

### 5. Iniciar todos os serviços

```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: ML API
cd ml-api
python -m uvicorn app.main:app --reload --port 8000

# Terminal 3: Node.js Backend
cd server
npm run dev

# Terminal 4: React Frontend
cd client
npm run dev
```

## 🎯 Funcionalidades Implementadas

### 1. API FastAPI (Python)

#### Endpoints Principais:

**POST /api/predictions/predict**
- Gera previsões usando Linear ou LSTM
- Parâmetros: user_id, category, days_ahead, model_type
- Retorna: previsões diárias com intervalos de confiança

**GET /api/predictions/insights/{user_id}**
- Analisa todas as categorias
- Identifica tendências
- Gera recomendações personalizadas

**GET /api/predictions/compare/{user_id}**
- Compara Linear vs LSTM
- Mostra métricas de acurácia
- Ajuda a escolher melhor modelo

#### Modelos de ML:

**Regressão Linear:**
- Preparação de dados diários
- Feature: dias desde início
- Treina com sklearn
- Calcula intervalos de confiança
- Identifica tendências (increasing/decreasing/stable)

**LSTM:**
- Rede neural com 2 camadas LSTM (50 unidades)
- Dropout (0.2) anti-overfitting
- Lookback de 7 dias
- Normalização MinMaxScaler
- Previsão recursiva

### 2. Backend Node.js

**Rotas criadas em `/api/predictions`:**

- `POST /predict` - Gera previsão
- `GET /insights` - Insights por categoria
- `GET /category/:category` - Previsão específica
- `GET /compare` - Compara modelos
- `GET /health` - Status da ML API

### 3. Frontend React

#### Componente PredictionChart:
- Gráfico de linha com Recharts
- Área de intervalo de confiança
- Tooltip customizado
- Responsivo
- Gradientes e animações

#### Página PredictionsPage:
- **Formulário de configuração**:
  - Seleção de categoria
  - Dias à frente (7-365)
  - Escolha do modelo (Linear/LSTM)

- **Cards de resumo**:
  - Total previsto
  - Média diária
  - Tendência
  - Confiança do modelo

- **Gráfico interativo**:
  - Linha de previsão
  - Área de confiança
  - Datas formatadas

- **Insights por categoria**:
  - Média atual vs prevista
  - Tendências por categoria
  - Recomendações personalizadas

- **Indicador de status**:
  - Mostra se ML API está conectada
  - Instruções para iniciar

## 📊 Como Usar

### Caso de Uso 1: Previsão Simples

```
1. Acesse /predictions
2. Selecione categoria (ou "Todas")
3. Escolha 30 dias
4. Selecione "Regressão Linear"
5. Clique em "Gerar Previsão"
6. Veja o gráfico e estatísticas
```

### Caso de Uso 2: Análise Profunda

```
1. Acesse /predictions
2. Deixe carregar os insights automáticos
3. Veja tendências de todas as categorias
4. Leia recomendações personalizadas
5. Compare modelo Linear vs LSTM
```

### Caso de Uso 3: Previsão de Longo Prazo

```
1. Selecione categoria específica
2. Configure 90 dias
3. Use modelo LSTM (se houver dados suficientes)
4. Analise tendência e intervalo de confiança
5. Ajuste seu orçamento baseado na previsão
```

## 🎨 Elementos Visuais

### Cores por Tendência:
- 📈 Aumentando: Vermelho (#f56565)
- 📉 Diminuindo: Verde (#48bb78)
- ➡️ Estável: Azul (#4299e1)

### Gráfico:
- Linha principal: Azul (#4299e1)
- Área de confiança: Laranja transparente
- Grid: Cinza (#4a5568)
- Tooltips: Fundo escuro com bordas

### Cards:
- Gradient de fundo
- Bordas coloridas à esquerda
- Ícones grandes
- Animações hover

## 🔬 Algoritmos e Fórmulas

### Regressão Linear

```python
# Modelo: y = mx + b
# Onde:
# x = dias desde primeira transação
# y = gasto diário
# m = coeficiente angular (tendência)
# b = intercepto

# Intervalo de confiança (95%):
lower = prediction - 1.96 * std_error
upper = prediction + 1.96 * std_error
```

### LSTM

```
Arquitetura:
Input (7 dias) → LSTM(50) → Dropout(0.2) →
LSTM(50) → Dropout(0.2) → Dense(25) → Dense(1)

Loss: MSE (Mean Squared Error)
Optimizer: Adam
Epochs: 50
Batch Size: 8
```

## 📈 Métricas de Avaliação

### R² Score (Linear)
- 1.0 = Perfeito
- > 0.7 = Bom
- 0.5-0.7 = Razoável
- < 0.5 = Ruim

### MAE (LSTM)
- Mean Absolute Error
- Quanto menor, melhor
- Em Reais (R$)

### Accuracy Score
- Calculado como: 1 - (std_error / mean_value)
- Exibido em porcentagem

## 🐛 Troubleshooting

### Problema: ML API desconectada

**Solução:**
```bash
cd ml-api
python -m uvicorn app.main:app --reload --port 8000
```

### Problema: TensorFlow error

**Solução:**
```bash
pip install tensorflow==2.15.0
# Ou para CPU-only:
pip install tensorflow-cpu==2.15.0
```

### Problema: Não há dados suficientes

**Causa:** Usuário precisa ter pelo menos:
- Linear: 2 dias de transações
- LSTM: 8 dias de transações

**Solução:** Adicione mais transações ou use modelo Linear

### Problema: Previsões muito diferentes

**Causa:** Normal! Modelos diferentes = resultados diferentes

**Explicação:**
- Linear extrapola tendência
- LSTM captura padrões complexos
- Use LSTM se houver sazonalidade

### Problema: Gráfico não aparece

**Solução:**
```bash
cd client
npm install recharts
npm run dev
```

## 🚀 Otimizações Futuras

### Performance:
- [ ] Cache de modelos treinados
- [ ] Batch predictions
- [ ] GPU support para LSTM
- [ ] Model persistence (salvar/carregar)

### Features:
- [ ] Previsão por dia da semana
- [ ] Detecção de anomalias
- [ ] Alertas automáticos quando previsão > orçamento
- [ ] Comparação com períodos passados
- [ ] Modelos por usuário (personalização)

### Modelos:
- [ ] Prophet (Facebook)
- [ ] ARIMA
- [ ] Ensemble methods
- [ ] Transfer learning

## 📚 Dependências Principais

### Python:
```
fastapi==0.104.1
tensorflow==2.15.0
scikit-learn==1.3.2
pandas==2.0.3
numpy==1.24.3
motor==3.3.2 (MongoDB async)
```

### JavaScript:
```json
{
  "axios": "^1.x.x",
  "recharts": "^2.x.x"
}
```

## 🎓 Conceitos de ML Utilizados

1. **Supervised Learning**: Modelos aprendem com dados históricos
2. **Time Series Forecasting**: Previsão de séries temporais
3. **Regression**: Prevê valores contínuos (gastos)
4. **Recurrent Neural Networks**: LSTM para sequências
5. **Feature Engineering**: Criação de features de data
6. **Normalization**: MinMaxScaler para LSTM
7. **Confidence Intervals**: Intervalos de confiança estatísticos

## 📊 Exemplos de Resultados

### Previsão Linear - 30 dias:
```json
{
  "total_predicted": 4500.00,
  "avg_daily_spending": 150.00,
  "trend": "increasing",
  "accuracy_score": 0.85
}
```

### Insights:
```json
{
  "categories": [
    {
      "category": "Alimentação",
      "current_avg": 140.00,
      "predicted_avg": 165.00,
      "trend": "increasing",
      "recommendation": "Seus gastos aumentando ~17.8%..."
    }
  ]
}
```

## 🔐 Segurança

- ML API não tem autenticação própria
- Autenticação via Node.js (JWT)
- User ID validado no backend
- CORS configurado
- Validação de inputs com Pydantic

## 🌟 Diferenciais

- ✅ Dois modelos (Linear + LSTM)
- ✅ Intervalos de confiança
- ✅ Insights automáticos
- ✅ Recomendações personalizadas
- ✅ Gráficos interativos
- ✅ Comparação de modelos
- ✅ Detecção de tendências
- ✅ API async (FastAPI + Motor)
- ✅ Documentação Swagger automática
- ✅ Responsive design

## 📖 Documentação Adicional

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **ML API README**: ml-api/README.md
- **Alertas README**: ALERTAS_FINANCEIROS.md

## 🎉 Conclusão

Sistema completo de previsões implementado com sucesso!

**Próximos passos:**
1. Adicionar mais transações para treinar melhor
2. Testar com dados reais
3. Ajustar hiperparâmetros se necessário
4. Monitorar acurácia dos modelos
5. Implementar melhorias listadas acima
