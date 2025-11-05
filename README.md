# SaveMyMoney 💰

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/seu-usuario/SaveMyMoney)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-yellow.svg)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Aplicação completa de gestão financeira pessoal com recursos avançados de IA, alertas inteligentes, sugestões de investimentos e cotações em tempo real.**

---

## 🚀 Deploy Rápido

> **Quer testar sem instalar localmente?**
>
> Siga o guia completo de deploy no Render (gratuito):
>
> 📘 **[DEPLOY_RENDER.md](./DEPLOY_RENDER.md)** - Deploy em 30 minutos
>
> Ou consulte os comandos rápidos:
>
> ⚡ **[COMANDOS_RAPIDOS.md](./COMANDOS_RAPIDOS.md)** - Copiar e colar

**Stack de Deploy:**
- **Frontend:** Render Static Site (Free)
- **Backend:** Render Web Service (Free)
- **Database:** MongoDB Atlas (Free M0)
- **ML API:** Render Web Service (Free) - Opcional

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Principais Funcionalidades](#principais-funcionalidades)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Documentação Detalhada](#documentação-detalhada)
- [Stack Tecnológica](#stack-tecnológica)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## 🎯 Visão Geral

SaveMyMoney é uma aplicação web moderna e completa para gestão de finanças pessoais, desenvolvida com tecnologias de ponta. O sistema oferece recursos avançados de análise financeira, previsões com Machine Learning, sugestões personalizadas de investimentos e acompanhamento de mercado em tempo real.

### Diferenciais

- 🤖 **IA/ML**: Previsões de gastos usando Linear Regression e LSTM
- 🚨 **Alertas Inteligentes**: Sistema proativo de avisos sobre orçamentos
- 💼 **Sugestões de Investimentos**: Recomendações personalizadas baseadas em perfil
- 📊 **Cotações em Tempo Real**: Ticker animado com ações e índices brasileiros
- 📱 **Design Responsivo**: Interface moderna e adaptável
- 🔐 **Segurança**: Autenticação JWT e proteção de dados

## ✨ Principais Funcionalidades

### 1. Dashboard Financeiro

Central de controle com visão geral completa:
- Resumo de receitas e despesas
- Gráficos interativos de categorias
- Alertas financeiros ativos
- Status de orçamentos
- Score de saúde financeira

### 2. Gestão de Transações

- Cadastro manual de receitas e despesas
- Categorização automática
- Filtros avançados por data, categoria, valor
- Exportação de dados (CSV, Excel)
- Histórico completo

### 3. OCR e Upload de Documentos

- **OCR de Recibos**: Upload de fotos de notas fiscais com extração automática de dados
- **Importação de Extratos**: Upload de PDFs de extratos bancários com parsing inteligente
- Suporte para múltiplos formatos
- Validação e revisão antes de salvar

### 4. Sistema de Alertas Financeiros 🚨

Sistema proativo que monitora seus gastos e avisa quando você está próximo dos limites:

**Características:**
- Configuração de limites por categoria
- Threshold de alerta personalizável (padrão: 80%)
- Alertas visuais com severidade (warning/danger)
- Períodos configuráveis (semanal, mensal, anual)
- Barras de progresso animadas
- Notificações toast em tempo real

**Documentação:** [ALERTAS.md](./ALERTAS.md)

### 5. Previsões com Machine Learning 🤖

API Python com FastAPI que utiliza modelos de ML para prever gastos futuros:

**Modelos Disponíveis:**
- **Regressão Linear**: Rápido, ideal para dados limitados
- **LSTM (Long Short-Term Memory)**: Mais preciso, captura padrões complexos

**Recursos:**
- Previsão de gastos totais ou por categoria
- Intervalos de confiança
- Comparação entre modelos
- Análise de tendências
- Insights por categoria

**Documentação:** [PREVISOES_ML.md](./PREVISOES_ML.md)

### 6. Sistema de Investimentos 💼

Análise financeira automática com sugestões personalizadas de investimentos:

**Funcionalidades:**
- Quiz interativo de perfil de investidor
- Cálculo automático de capacidade de poupança
- Score de saúde financeira (0-100)
- Sugestões de produtos:
  - Reserva de Emergência
  - Tesouro Selic
  - CDBs
  - Tesouro IPCA+
  - LCI/LCA
  - Fundos de Investimento
- Match score para cada produto
- Prós e contras detalhados
- Informações sobre liquidez, IR, FGC

**Documentação:** [INVESTIMENTOS.md](./INVESTIMENTOS.md)

### 7. Cotações em Tempo Real 📊

Ticker animado com cotações de ações, índices e moedas:

**Características:**
- Auto-refresh a cada 60 segundos
- Scrolling horizontal suave e infinito
- Indicadores visuais (verde ▲ / vermelho ▼)
- Cache inteligente (TTL 1 minuto)
- Integração com Brapi (gratuito)
- Fallback para Yahoo Finance (opcional)
- Design responsivo
- Pause ao hover

**Documentação:** [COTACOES.md](./COTACOES.md)

### 8. Gráficos Dinâmicos (Streamlit) 📊

Aplicação Streamlit para análise visual customizável dos seus dados financeiros:

**Recursos:**
- 10 tipos de gráficos interativos
- Filtros avançados (categorias, subcategorias, tipo, período)
- Métricas em tempo real
- Exportação de dados em CSV
- Conexão direta com MongoDB
- Tema cyber-futuristic

**Tipos de Gráficos:**
- Barras (Categorias, Subcategorias, Período)
- Linhas (Evolução Temporal)
- Pizza (Distribuição por Categoria/Subcategoria)
- Scatter (Valor vs Data)
- Funil (Categorias Ordenadas)
- Treemap (Hierarquia de Gastos)
- Heatmap (Gastos por Dia da Semana/Mês)

**Documentação:** [streamlit_app/README.md](./streamlit_app/README.md)

## 🏗️ Arquitetura

### Estrutura do Projeto

```
SaveMyMoney/
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── App.jsx         # Componente principal
│   │   └── main.jsx        # Entry point
│   └── package.json
│
├── server/                 # Backend Node.js + Express
│   ├── config/             # Configurações (DB, etc)
│   ├── middleware/         # Middlewares (auth, etc)
│   ├── models/             # Modelos Mongoose
│   ├── routes/             # Rotas da API
│   ├── services/           # Lógica de negócio
│   ├── index.js            # Entry point
│   └── package.json
│
├── ml-api/                 # API Python para ML
│   ├── app/
│   │   ├── ml/             # Modelos de ML
│   │   ├── routers/        # Rotas FastAPI
│   │   └── main.py         # Entry point
│   ├── requirements.txt
│   └── README.md
│
├── streamlit_app/          # Gráficos Dinâmicos (Streamlit)
│   ├── app.py              # Aplicação principal
│   ├── requirements.txt    # Dependências Python
│   ├── .env.example        # Exemplo de configuração
│   └── README.md           # Documentação
│
├── ALERTAS.md              # Docs: Sistema de Alertas
├── PREVISOES_ML.md         # Docs: Previsões ML
├── INVESTIMENTOS.md        # Docs: Investimentos
├── COTACOES.md             # Docs: Cotações
└── README.md               # Este arquivo
```

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  React + Vite + React Router + Recharts                     │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND API                              │
│  Node.js + Express + MongoDB + Mongoose                     │
├─────────────────────────────────────────────────────────────┤
│  Routes:                                                     │
│  • /api/auth          - Autenticação JWT                    │
│  • /api/transactions  - Transações CRUD                     │
│  • /api/budgets       - Orçamentos e Alertas                │
│  • /api/investments   - Perfil e Sugestões                  │
│  • /api/market        - Cotações em Tempo Real              │
│  • /api/predictions   - Proxy para ML API                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ↓                               ↓
┌──────────────────┐         ┌──────────────────────┐
│   MONGODB        │         │     ML API           │
│   Database       │         │  FastAPI + Python    │
└──────────────────┘         │  TensorFlow + sklearn│
                             └──────────────────────┘
                                      │
                              ┌───────┴────────┐
                              ↓                ↓
                      ┌──────────────┐  ┌──────────────┐
                      │ Linear Reg   │  │  LSTM Model  │
                      └──────────────┘  └──────────────┘
```

## 🚀 Instalação

### Pré-requisitos

- **Node.js**: v18+ (recomendado v20)
- **Python**: 3.9+ (para ML API)
- **MongoDB**: v6+ (local ou Atlas)
- **npm** ou **yarn**
- **pip** (Python package manager)

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/SaveMyMoney.git
cd SaveMyMoney
```

### 2. Backend (Node.js)

```bash
cd server
npm install
```

Crie o arquivo `.env`:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/savemymoney
# ou MongoDB Atlas:
# MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/savemymoney

# JWT
JWT_SECRET=seu_secret_super_secreto_aqui

# Servidor
PORT=5000

# Cotações (opcional - apenas para Yahoo Finance)
YAHOO_FINANCE_KEY=sua_rapidapi_key_aqui
```

Inicie o servidor:

```bash
npm start
# ou para desenvolvimento:
npm run dev
```

### 3. Frontend (React)

```bash
cd client
npm install
```

Crie o arquivo `.env`:

```env
VITE_API_URL=http://localhost:5000
```

Inicie o cliente:

```bash
npm run dev
```

Acesse: http://localhost:5173

### 4. ML API (Python) - Opcional

```bash
cd ml-api
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

Crie o arquivo `.env`:

```env
NODE_API_URL=http://localhost:5000
```

Inicie a API:

```bash
uvicorn app.main:app --reload --port 8000
```

Acesse: http://localhost:8000/docs (Swagger UI)

### 5. Streamlit App (Gráficos Dinâmicos) - Opcional

```bash
cd streamlit_app
pip install -r requirements.txt
```

Crie o arquivo `.env`:

```env
MONGO_URI=mongodb://localhost:27017/savemymoney
# ou use a mesma URI do backend
```

Inicie a aplicação:

```bash
streamlit run app.py
```

Acesse: http://localhost:8501

**Consulte a documentação completa:** [streamlit_app/README.md](./streamlit_app/README.md)

### 6. MongoDB

**Opção 1: Local**
```bash
# Instale MongoDB Community Edition
# Windows: https://www.mongodb.com/try/download/community
# Linux: sudo apt install mongodb
# Mac: brew install mongodb-community

# Inicie o serviço
mongod
```

**Opção 2: MongoDB Atlas (Cloud)**
1. Crie conta em https://www.mongodb.com/cloud/atlas
2. Crie um cluster gratuito
3. Configure acesso de rede (IP whitelist)
4. Obtenha a connection string
5. Adicione no `.env` do backend

## ⚙️ Configuração

### Variáveis de Ambiente

#### Backend (`server/.env`)

| Variável | Descrição | Obrigatório | Padrão |
|----------|-----------|-------------|--------|
| `MONGO_URI` | Connection string do MongoDB | Sim | - |
| `JWT_SECRET` | Secret para tokens JWT | Sim | - |
| `PORT` | Porta do servidor | Não | 5000 |
| `YAHOO_FINANCE_KEY` | RapidAPI key para Yahoo Finance | Não | - |

#### Frontend (`client/.env`)

| Variável | Descrição | Obrigatório | Padrão |
|----------|-----------|-------------|--------|
| `VITE_API_URL` | URL da API backend | Sim | http://localhost:5000 |

#### ML API (`ml-api/.env`)

| Variável | Descrição | Obrigatório | Padrão |
|----------|-----------|-------------|--------|
| `NODE_API_URL` | URL da API Node.js | Sim | http://localhost:5000 |

### Configuração do Ticker de Cotações

Para personalizar os símbolos do ticker, edite `server/routes/api/market.js`:

```javascript
// Linha ~121
const symbols = ['PETR4', 'VALE3', 'ITUB4', 'MGLU3', 'WEGE3', 'ABEV3'];
```

Símbolos suportados pela Brapi (gratuita):
- Ações B3: `PETR4`, `VALE3`, `ITUB4`, `MGLU3`, `WEGE3`, `ABEV3`, etc.
- Para lista completa: https://brapi.dev/docs

### Configuração de Alertas

Altere o threshold padrão no modelo Budget (`server/models/Budget.js`):

```javascript
warningThreshold: {
  type: Number,
  default: 80,  // Altere aqui (50-100)
}
```

## 📚 Documentação Detalhada

Cada módulo possui documentação completa com exemplos, troubleshooting e best practices:

- **[ALERTAS.md](./ALERTAS.md)** - Sistema de Alertas Financeiros
  - Configuração de limites
  - Tipos de alertas
  - Customização
  - Troubleshooting

- **[PREVISOES_ML.md](./PREVISOES_ML.md)** - API de Previsões ML
  - Modelos disponíveis (Linear Regression, LSTM)
  - Endpoints da API
  - Treinamento e deploy
  - Parâmetros e otimização

- **[INVESTIMENTOS.md](./INVESTIMENTOS.md)** - Sistema de Investimentos
  - Algoritmo de recomendação
  - Produtos suportados
  - Cálculo de perfil
  - Personalização

- **[COTACOES.md](./COTACOES.md)** - Cotações em Tempo Real
  - APIs utilizadas (Brapi, Yahoo Finance)
  - Sistema de cache
  - Customização do ticker
  - Performance

## 🛠️ Stack Tecnológica

### Frontend

- **React** 18.3 - Biblioteca UI
- **Vite** 5.2 - Build tool
- **React Router** 6 - Roteamento
- **Axios** - HTTP client
- **Recharts** - Gráficos interativos
- **CSS3** - Estilização moderna (gradients, animations, flexbox)

### Backend

- **Node.js** 20 - Runtime JavaScript
- **Express** 4.19 - Framework web
- **MongoDB** 8 - Banco de dados NoSQL
- **Mongoose** 8.4 - ODM para MongoDB
- **JWT** - Autenticação stateless
- **bcrypt** - Hash de senhas
- **Multer** - Upload de arquivos
- **Tesseract.js** - OCR
- **pdf-parse** - Parsing de PDFs
- **Axios** - HTTP client

### ML API

- **Python** 3.9+
- **FastAPI** - Framework web assíncrono
- **TensorFlow/Keras** - Deep Learning (LSTM)
- **scikit-learn** - Machine Learning (Linear Regression)
- **NumPy** - Computação numérica
- **Pandas** - Manipulação de dados
- **Pydantic** - Validação de dados

### Streamlit App

- **Python** 3.8+
- **Streamlit** - Framework de dashboards interativos
- **Plotly** - Gráficos interativos avançados
- **Pandas** - Manipulação de dados
- **pymongo** - Driver MongoDB para Python

### Integrações

- **Brapi** - API gratuita de mercado financeiro brasileiro
- **Yahoo Finance** - API de mercado global (via RapidAPI)
- **MongoDB Atlas** - Banco de dados cloud (opcional)

### DevOps (Futuro)

- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Nginx (Reverse proxy)
- PM2 (Process manager)

## 📸 Screenshots

### Dashboard
![Dashboard](./docs/screenshots/dashboard.png)
*Dashboard com resumo financeiro, gráficos e alertas*

### Alertas Financeiros
![Alertas](./docs/screenshots/alertas.png)
*Sistema de alertas com barras de progresso e status*

### Previsões ML
![Previsões](./docs/screenshots/previsoes.png)
*Gráfico de previsões com intervalos de confiança*

### Investimentos
![Investimentos](./docs/screenshots/investimentos.png)
*Sugestões personalizadas de investimentos*

### Ticker de Cotações
![Ticker](./docs/screenshots/ticker.png)
*Ticker animado com cotações em tempo real*

## 🗺️ Roadmap

### v1.0 (Atual) ✅

- [x] Gestão de transações
- [x] Sistema de orçamentos
- [x] Dashboard com gráficos
- [x] OCR de recibos
- [x] Import de extratos PDF
- [x] Alertas financeiros
- [x] Previsões com ML
- [x] Sugestões de investimentos
- [x] Cotações em tempo real

### v1.1 (Próximo)

- [ ] Gráficos de investimentos no tempo
- [ ] Comparação de portfólio
- [ ] Notificações push
- [ ] Modo escuro completo
- [ ] Exportação de relatórios PDF
- [ ] Integração com Open Banking
- [ ] App mobile (React Native)

### v2.0 (Futuro)

- [ ] Metas financeiras com tracking
- [ ] Planner de aposentadoria
- [ ] Análise técnica de ações
- [ ] Chat bot com IA
- [ ] Multi-usuário (família/grupos)
- [ ] Sincronização bancária automática
- [ ] Marketplace de serviços financeiros
- [ ] API pública para desenvolvedores

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Diretrizes

- Escreva código limpo e documentado
- Adicione testes quando possível
- Siga o estilo de código existente
- Atualize a documentação se necessário
- Teste localmente antes de submeter PR

### Reportando Bugs

Abra uma issue com:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Ambiente (OS, Node version, etc)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

## 👥 Autores

- **Seu Nome** - Desenvolvimento inicial - [GitHub](https://github.com/seu-usuario)

## 🙏 Agradecimentos

- **Brapi** - API gratuita de mercado financeiro brasileiro
- **RapidAPI** - Plataforma de APIs
- **MongoDB** - Banco de dados
- **FastAPI** - Framework Python
- **React** - Biblioteca UI
- **TensorFlow** - Framework de ML
- **Comunidade Open Source** - Ferramentas e inspiração

## 📞 Suporte

- **Documentação**: Veja os arquivos `.md` na raiz do projeto
- **Issues**: https://github.com/seu-usuario/SaveMyMoney/issues
- **Email**: seu-email@exemplo.com
- **Discord**: [Link do servidor](https://discord.gg/seu-servidor)

---

**Desenvolvido com ❤️ para ajudar você a cuidar melhor do seu dinheiro**

⭐ Se este projeto te ajudou, considere dar uma estrela no GitHub!
