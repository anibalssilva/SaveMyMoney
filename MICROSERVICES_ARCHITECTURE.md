# 🏗️ Arquitetura de Microsserviços - SaveMyMoney

## 📊 Status Atual da Aplicação

### ✅ **Você JÁ TEM microsserviços!**

Sua aplicação atual já segue princípios de microsserviços:

```
┌──────────────────┐
│    Frontend      │  ← Microsserviço 1 (UI)
│   React + Vite   │
└────────┬─────────┘
         │
         ↓ REST API
┌──────────────────┐
│    Backend       │  ← Microsserviço 2 (API Gateway + Business Logic)
│  Node.js/Express │
└────────┬─────────┘
         │
         ├─────────→ ┌──────────────────┐
         │           │     ML API       │  ← Microsserviço 3 (Machine Learning)
         │           │  Python/FastAPI  │
         │           └──────────────────┘
         │
         ↓
┌──────────────────┐
│   MongoDB Atlas  │  ← Banco de dados compartilhado
└──────────────────┘
```

**Características de Microsserviços que você JÁ tem**:
- ✅ Serviços independentes (Frontend, Backend, ML API)
- ✅ Deploy independente (cada um no Render separado)
- ✅ Comunicação via API REST
- ✅ Tecnologias diferentes (React, Node.js, Python)
- ✅ Escalabilidade independente

---

## 🎯 Arquitetura Ideal de Microsserviços

Vou propor uma arquitetura completa e moderna:

### **Arquitetura Proposta**

```
                         ┌─────────────────────────────────┐
                         │         Internet/Users          │
                         └────────────────┬────────────────┘
                                          │
                         ┌────────────────▼────────────────┐
                         │       Load Balancer / CDN       │
                         │         (Cloudflare)            │
                         └────────────────┬────────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                           │                           │
              ▼                           ▼                           ▼
    ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
    │   Frontend      │        │   API Gateway   │        │   Admin Panel   │
    │  React + Vite   │        │  (Node.js)      │        │   (Optional)    │
    │  Port: 5173     │        │  Port: 5000     │        │                 │
    └─────────────────┘        └────────┬────────┘        └─────────────────┘
                                        │
                  ┌─────────────────────┼─────────────────────┐
                  │                     │                     │
                  ▼                     ▼                     ▼
        ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
        │  Auth Service    │  │ Transaction Svc  │  │  Budget Service  │
        │  (Node.js)       │  │  (Node.js)       │  │  (Node.js)       │
        │  JWT + 2FA       │  │  CRUD + OCR      │  │  Alerts          │
        └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
                 │                     │                     │
                 └──────────┬──────────┴──────────┬──────────┘
                            │                     │
          ┌─────────────────┼─────────────────────┼─────────────────┐
          ▼                 ▼                     ▼                 ▼
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │  ML Service │  │ OCR Service │  │ PDF Service │  │ Investment  │
  │  (Python)   │  │ (Node.js)   │  │ (Node.js)   │  │ Service     │
  │  FastAPI    │  │ Tesseract   │  │ pdf-parse   │  │ (Node.js)   │
  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
         │                │                │                │
         └────────────────┴────────────────┴────────────────┘
                                   │
                          ┌────────▼────────┐
                          │  Message Queue  │
                          │  (Redis/RabbitMQ)│
                          └────────┬────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
  │  MongoDB    │         │   Redis     │         │  PostgreSQL │
  │  (NoSQL)    │         │  (Cache)    │         │  (Optional) │
  └─────────────┘         └─────────────┘         └─────────────┘
```

---

## 🔧 Divisão em Microsserviços

### **1. Frontend Service** (Atual)
**Responsabilidade**: Interface do usuário
- React + Vite
- PWA (Service Worker)
- Client-side routing
- State management

**Deploy**: Render Static Site ou Vercel

---

### **2. API Gateway** (Novo - Recomendado)
**Responsabilidade**: Roteamento e autenticação central
- Roteamento para microsserviços
- Rate limiting
- Authentication (JWT validation)
- Load balancing
- CORS management

**Tecnologia**: Node.js + Express ou Kong/Nginx

**Exemplo**:
```javascript
// API Gateway routes
app.use('/api/auth', proxy('http://auth-service:3001'));
app.use('/api/transactions', authMiddleware, proxy('http://transaction-service:3002'));
app.use('/api/ml', authMiddleware, proxy('http://ml-service:8000'));
```

---

### **3. Auth Service** (Extrair do Backend)
**Responsabilidade**: Autenticação e autorização
- User registration
- Login/Logout
- JWT generation
- 2FA (TOTP)
- Password reset
- Session management

**Endpoints**:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/2fa/enable`
- `POST /auth/2fa/verify`
- `POST /auth/refresh-token`

**Database**: MongoDB (users collection)

---

### **4. Transaction Service** (Extrair do Backend)
**Responsabilidade**: Gerenciamento de transações
- CRUD de transações
- Filtros e busca
- Paginação
- Export (CSV/XLSX)

**Endpoints**:
- `GET /transactions`
- `POST /transactions`
- `PUT /transactions/:id`
- `DELETE /transactions/:id`
- `GET /transactions/export`

**Database**: MongoDB (transactions collection)

**Events Emitted**:
- `transaction.created`
- `transaction.updated`
- `transaction.deleted`

---

### **5. Budget Service** (Extrair do Backend)
**Responsabilidade**: Orçamentos e alertas
- CRUD de orçamentos
- Cálculo de gastos
- Alertas de orçamento
- Notificações

**Endpoints**:
- `GET /budgets`
- `POST /budgets`
- `GET /budgets/alerts`

**Database**: MongoDB (budgets collection)

**Events Listened**:
- `transaction.created` → Verificar se ultrapassou orçamento

---

### **6. OCR Service** (Extrair do Backend)
**Responsabilidade**: Processamento de recibos
- Upload de imagens
- OCR com Tesseract.js
- AI OCR com GPT-4 Vision
- Extração de dados estruturados

**Endpoints**:
- `POST /ocr/extract`
- `POST /ocr/save`

**Technology**: Node.js + Tesseract.js + OpenAI

**Storage**: S3 ou local filesystem

---

### **7. PDF Service** (Extrair do Backend)
**Responsabilidade**: Processamento de extratos bancários
- Upload de PDFs
- Parsing de extratos
- Detecção de padrões

**Endpoints**:
- `POST /pdf/upload`
- `POST /pdf/extract`

**Technology**: Node.js + pdf-parse

---

### **8. ML Service** (Atual)
**Responsabilidade**: Machine Learning e previsões
- Previsões de gastos
- Regressão Linear
- LSTM
- Insights financeiros

**Endpoints**:
- `POST /ml/predict`
- `GET /ml/insights`
- `GET /ml/category/:id`

**Technology**: Python + FastAPI + TensorFlow

**Database**: MongoDB (para leitura de dados históricos)

---

### **9. Investment Service** (Extrair do Backend)
**Responsabilidade**: Recomendações de investimentos
- Análise de perfil
- Recomendações personalizadas
- Portfolio tracking
- Market data (APIs externas)

**Endpoints**:
- `GET /investments/profile`
- `POST /investments/analyze`
- `GET /investments/recommendations`
- `GET /investments/portfolio`

**External APIs**: Yahoo Finance, Brapi

---

### **10. Notification Service** (Novo)
**Responsabilidade**: Envio de notificações
- Email (budget alerts, etc.)
- Push notifications (PWA)
- SMS (opcional)
- In-app notifications

**Endpoints**:
- `POST /notifications/send`
- `GET /notifications/user/:id`

**Technology**: Node.js + Nodemailer + Firebase Cloud Messaging

**Events Listened**:
- `budget.exceeded`
- `transaction.created`
- `investment.recommendation`

---

### **11. Analytics Service** (Novo)
**Responsabilidade**: Analytics e relatórios
- Dashboards
- Métricas agregadas
- Relatórios customizados
- Data export

**Endpoints**:
- `GET /analytics/summary`
- `GET /analytics/trends`
- `GET /analytics/reports`

**Technology**: Node.js + Chart.js (server-side)

**Database**: PostgreSQL ou MongoDB (read replicas)

---

## 🔄 Comunicação entre Microsserviços

### **Padrão 1: Comunicação Síncrona (REST)**
```
Frontend → API Gateway → Auth Service → Response
```

**Vantagens**:
- Simples de implementar
- Fácil debug
- Response imediato

**Desvantagens**:
- Acoplamento temporal
- Cascata de falhas

---

### **Padrão 2: Comunicação Assíncrona (Message Queue)**
```
Transaction Service → Redis Queue → Budget Service
                                  → Analytics Service
                                  → Notification Service
```

**Vantagens**:
- Desacoplamento total
- Resiliência (retry automático)
- Escalabilidade

**Tecnologias**:
- **Redis Pub/Sub**: Simples, rápido
- **RabbitMQ**: Robusto, features avançadas
- **Apache Kafka**: High throughput, streaming

**Exemplo com Redis**:
```javascript
// Transaction Service (Publisher)
await redis.publish('transaction.created', JSON.stringify({
  id: transaction._id,
  userId: transaction.user,
  amount: transaction.amount,
  category: transaction.category
}));

// Budget Service (Subscriber)
redis.subscribe('transaction.created', async (message) => {
  const transaction = JSON.parse(message);
  await checkBudgetAlert(transaction);
});
```

---

### **Padrão 3: Event Sourcing** (Avançado)
```
All services → Event Store → Aggregated Views
```

**Vantagens**:
- História completa de mudanças
- Time travel (replay events)
- Auditoria completa

**Desvantagens**:
- Complexidade alta
- Eventual consistency

---

## 🗄️ Estratégias de Banco de Dados

### **Opção 1: Database per Service** (Ideal)
```
Auth Service      → MongoDB (users DB)
Transaction Svc   → MongoDB (transactions DB)
Budget Service    → MongoDB (budgets DB)
Analytics Service → PostgreSQL (analytics DB)
```

**Vantagens**:
- Desacoplamento total
- Tecnologia otimizada por serviço
- Escalabilidade independente

**Desvantagens**:
- Queries cross-service complexas
- Sincronização de dados

---

### **Opção 2: Shared Database** (Atual - Mais simples)
```
All Services → MongoDB Atlas (shared)
```

**Vantagens**:
- Simples de implementar
- Queries diretas
- Transações ACID

**Desvantagens**:
- Acoplamento de schema
- Escalabilidade limitada

---

### **Opção 3: Híbrida** (Recomendada)
```
Auth Service      → MongoDB (users)
Transaction Svc   → MongoDB (transactions) ← Shared
Budget Service    → MongoDB (budgets)      ← Shared
ML Service        → MongoDB (read-only)
Analytics Service → PostgreSQL (aggregated data)
Cache Layer       → Redis (hot data)
```

---

## 🚀 Roadmap de Migração

### **Fase 1: Preparação** (1-2 semanas)
- [ ] Documentar API atual completa
- [ ] Identificar dependências entre módulos
- [ ] Setup de ambiente de desenvolvimento (Docker Compose)
- [ ] Configurar CI/CD

### **Fase 2: Extração Gradual** (2-3 semanas)
1. **Semana 1**: Auth Service
   - Extrair rotas `/auth/*`
   - Criar serviço independente
   - Deploy no Render
   - Atualizar API Gateway

2. **Semana 2**: Transaction Service
   - Extrair rotas `/transactions/*`
   - Implementar event emitters
   - Deploy

3. **Semana 3**: Budget Service
   - Extrair rotas `/budgets/*`
   - Implementar event listeners
   - Deploy

### **Fase 3: Serviços Novos** (2-3 semanas)
- [ ] API Gateway (Kong ou custom)
- [ ] Notification Service
- [ ] Analytics Service

### **Fase 4: Message Queue** (1 semana)
- [ ] Setup Redis ou RabbitMQ
- [ ] Implementar publishers
- [ ] Implementar subscribers
- [ ] Monitoramento de filas

### **Fase 5: Observabilidade** (1 semana)
- [ ] Logging centralizado (ELK Stack)
- [ ] Distributed tracing (Jaeger)
- [ ] Metrics (Prometheus + Grafana)
- [ ] Alerting

---

## 🛠️ Stack Tecnológica Recomendada

### **Development**
- **Docker**: Containerização
- **Docker Compose**: Orquestração local
- **Kubernetes** (futuro): Orquestração produção

### **API Gateway**
- **Kong**: Open-source, features robustas
- **Express Gateway**: Node.js nativo
- **Nginx**: Lightweight, rápido

### **Message Queue**
- **Redis**: Simples, rápido, caching + pub/sub
- **RabbitMQ**: Robusto, retry, dead letter queues
- **Apache Kafka**: High throughput (overkill para seu caso)

### **Monitoring**
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards
- **Jaeger**: Distributed tracing
- **ELK Stack**: Logging (Elasticsearch, Logstash, Kibana)

### **Service Mesh** (Avançado)
- **Istio**: Traffic management, security
- **Linkerd**: Lightweight alternative

---

## 📦 Exemplo de Estrutura de Projeto

```
SaveMyMoney/
├── services/
│   ├── api-gateway/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js
│   │       ├── routes/
│   │       └── middleware/
│   │
│   ├── auth-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js
│   │       ├── controllers/
│   │       ├── models/
│   │       └── routes/
│   │
│   ├── transaction-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │
│   ├── budget-service/
│   ├── ocr-service/
│   ├── pdf-service/
│   ├── ml-service/
│   ├── investment-service/
│   ├── notification-service/
│   └── analytics-service/
│
├── frontend/
│   ├── Dockerfile
│   └── src/
│
├── infrastructure/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── kubernetes/
│   │   ├── deployments/
│   │   ├── services/
│   │   └── ingress/
│   └── terraform/
│
├── shared/
│   ├── proto/  (se usar gRPC)
│   ├── events/
│   └── utils/
│
└── docs/
    ├── architecture.md
    ├── api-specs/
    └── diagrams/
```

---

## 🐳 Docker Compose Exemplo

```yaml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build: ./services/api-gateway
    ports:
      - "5000:5000"
    environment:
      - AUTH_SERVICE_URL=http://auth-service:3001
      - TRANSACTION_SERVICE_URL=http://transaction-service:3002
    depends_on:
      - auth-service
      - transaction-service

  # Auth Service
  auth-service:
    build: ./services/auth-service
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/auth
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
      - redis

  # Transaction Service
  transaction-service:
    build: ./services/transaction-service
    ports:
      - "3002:3002"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/transactions
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  # Budget Service
  budget-service:
    build: ./services/budget-service
    ports:
      - "3003:3003"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/budgets
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  # ML Service
  ml-service:
    build: ./services/ml-service
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/ml
    depends_on:
      - mongo

  # MongoDB
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  # Frontend
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://api-gateway:5000

volumes:
  mongo-data:
  redis-data:
```

---

## 💰 Custo Estimado (Render)

### **Plano Free** (Limitado)
- 3 Web Services grátis
- 750 horas/mês cada
- 512 MB RAM
- Sleep após 15min inatividade

**Total**: $0/mês
**Limitações**: Services dormem, compartilham recursos

### **Plano Starter** (Recomendado para produção)
- Frontend: $7/mês (Static Site)
- API Gateway: $7/mês
- Auth Service: $7/mês
- Transaction Service: $7/mês
- Budget Service: $7/mês
- ML Service: $25/mês (Python, mais RAM)
- MongoDB Atlas: $0-9/mês (M0 Shared ou M10)
- Redis Cloud: $0/mês (30MB free)

**Total Estimado**: $67-76/mês

### **Alternativas Mais Baratas**
- **DigitalOcean**: $12/mês (1 droplet, todos os serviços)
- **AWS Free Tier**: Grátis por 12 meses
- **Google Cloud Run**: Pay-per-use
- **Railway**: Similar ao Render, preços competitivos

---

## 📊 Vantagens vs Desvantagens

### **Vantagens**
✅ Escalabilidade independente por serviço
✅ Deploy independente (menos risco)
✅ Tecnologias diferentes por necessidade
✅ Equipes podem trabalhar em paralelo
✅ Falhas isoladas (um serviço cai, outros continuam)
✅ Reutilização de serviços
✅ Melhor organização de código

### **Desvantagens**
❌ Complexidade operacional maior
❌ Debugging mais difícil
❌ Latência de rede entre serviços
❌ Gerenciamento de transações distribuídas
❌ Custo de infraestrutura maior
❌ Necessidade de DevOps skills
❌ Eventual consistency

---

## 🎯 Recomendação Final

### **Para seu caso (SaveMyMoney)**:

**Arquitetura Atual (Mantém)**:
```
Frontend (React) + Backend (Node.js) + ML API (Python)
```
✅ **Suficiente** para:
- MVP e validação
- Até ~10k usuários
- Equipe pequena (1-3 devs)

**Evolução Gradual (Recomendado)**:
1. **Fase 1**: Adicionar Redis para cache
2. **Fase 2**: Extrair Auth Service
3. **Fase 3**: Message Queue para eventos
4. **Fase 4**: Demais serviços conforme necessidade

**Full Microservices (Futuro)**:
- Quando crescer (>10k usuários)
- Quando tiver equipe maior (>5 devs)
- Quando necessitar alta disponibilidade (99.99%)

---

## 📚 Recursos de Aprendizado

### **Cursos**
- [Microservices with Node.js](https://www.udemy.com/course/microservices-with-node-js-and-react/)
- [Docker & Kubernetes](https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/)

### **Livros**
- "Building Microservices" - Sam Newman
- "Microservices Patterns" - Chris Richardson

### **Ferramentas**
- Docker Desktop
- Kubernetes (Minikube para local)
- Postman (API testing)
- k6 (Load testing)

---

**🎉 Sim, sua aplicação pode ser transformada em microsserviços! E você já está no caminho certo!**

**Próximo passo sugerido**: Dockerizar cada serviço existente e usar Docker Compose localmente.
