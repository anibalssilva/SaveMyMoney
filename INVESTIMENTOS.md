# Sistema de Sugestões de Investimentos

## 🎯 Visão Geral

Sistema completo e inteligente que analisa a situação financeira do usuário e sugere investimentos personalizados, incluindo reserva de emergência, CDBs, Tesouro Direto e outros produtos financeiros.

## 📊 Funcionalidades Principais

### 1. **Análise Financeira Automática**
- Calcula renda mensal média (últimos 6 meses)
- Calcula gastos mensais médios (últimos 3 meses)
- Determina capacidade de poupança
- Calcula taxa de poupança (%)
- Gera score de saúde financeira (0-100)

### 2. **Perfil de Investidor**
- **Conservador**: Prioriza segurança e liquidez
- **Moderado**: Equilibra risco e retorno
- **Arrojado**: Busca rentabilidade máxima

### 3. **Reserva de Emergência Inteligente**
- Cálculo baseado em gastos mensais
- Conservador: 12 meses
- Moderado: 6 meses
- Arrojado: 4 meses

### 4. **Motor de Recomendações**

#### Produtos Disponíveis:
- **Reserva de Emergência** (Liquidez imediata, ~100% CDI)
- **Tesouro Selic** (Baixo risco, liquidez diária)
- **CDB** (Rentabilidade superior, FGC)
- **Tesouro IPCA+** (Proteção inflação, longo prazo)
- **LCI/LCA** (Isento IR, alto mínimo)
- **Fundos Renda Fixa** (Gestão profissional)
- **Fundos Multimercado** (Maior potencial retorno)

### 5. **Sistema de Priorização**
1. **Prioridade 5 (Máxima)**: Reserva de emergência
2. **Prioridade 4**: Tesouro Selic
3. **Prioridade 3**: CDB, Tesouro IPCA, LCI/LCA
4. **Prioridade 2**: Fundos

### 6. **Adequação ao Perfil (Match Score)**
- Algoritmo calcula compatibilidade 0-100%
- Considera risco, liquidez, prazo e objetivos
- Recomenda produtos mais alinhados primeiro

## 🏗️ Arquitetura

### Backend (Node.js)

```
server/
├── models/
│   ├── InvestorProfile.js      # Perfil do investidor
│   └── InvestmentSuggestion.js # Sugestões geradas
├── services/
│   ├── financialAnalyzer.js    # Análise financeira
│   └── investmentRecommender.js # Motor de recomendações
└── routes/api/
    └── investments.js           # Rotas da API
```

### Frontend (React)

```
client/src/
├── components/
│   ├── InvestmentCard.jsx      # Card de investimento
│   └── InvestmentCard.css
└── pages/
    ├── InvestmentsPage.jsx     # Página principal
    └── InvestmentsPage.css
```

## 📁 Modelos de Dados

### InvestorProfile

```javascript
{
  user: ObjectId,
  riskProfile: 'conservative' | 'moderate' | 'aggressive',
  age: Number,
  monthlyIncome: Number,
  savingsRate: Number,
  goals: [{
    name: String,
    type: 'emergency' | 'short-term' | 'medium-term' | 'long-term' | 'retirement',
    targetAmount: Number,
    currentAmount: Number,
    deadline: Date,
    priority: Number (1-5)
  }],
  investmentExperience: 'beginner' | 'intermediate' | 'advanced',
  hasEmergencyFund: Boolean,
  emergencyFundAmount: Number,
  preferences: {
    lowLiquidity: Boolean,
    taxBenefits: Boolean,
    sustainableInvestments: Boolean
  }
}
```

### InvestmentSuggestion

```javascript
{
  user: ObjectId,
  productType: String,
  productName: String,
  description: String,
  category: 'renda-fixa' | 'renda-variavel' | 'fundos' | 'reserva',
  expectedReturn: Number, // % anual
  riskLevel: Number (1-5),
  liquidity: 'immediate' | 'daily' | 'monthly' | 'maturity',
  minimumInvestment: Number,
  suggestedAmount: Number,
  recommendedTerm: Number, // meses
  matchScore: Number (0-100),
  reason: String,
  pros: [String],
  cons: [String],
  priority: Number (1-5),
  relatedGoal: String,
  additionalInfo: {
    taxable: Boolean,
    covered: Boolean,
    indexer: String
  }
}
```

## 🔌 API Endpoints

### GET /api/investments/profile
Busca perfil do investidor.

**Response:**
```json
{
  "riskProfile": "moderate",
  "age": 30,
  "monthlyIncome": 5000,
  "hasEmergencyFund": false,
  "goals": []
}
```

### POST /api/investments/profile
Cria ou atualiza perfil.

**Body:**
```json
{
  "riskProfile": "moderate",
  "age": 30,
  "monthlyIncome": 5000,
  "savingsRate": 20,
  "hasEmergencyFund": false
}
```

### GET /api/investments/analysis
Análise financeira completa.

**Response:**
```json
{
  "financialHealth": {
    "score": 65,
    "rating": "Boa",
    "monthlyIncome": 5000,
    "monthlyExpenses": 3500,
    "savingsCapacity": 1500,
    "savingsRate": 30
  },
  "emergencyFund": {
    "recommendedAmount": 21000,
    "months": 6,
    "currentAmount": 0,
    "completionPercentage": 0
  },
  "categoryAnalysis": [...]
}
```

### GET /api/investments/suggestions
Gera sugestões personalizadas.

**Response:**
```json
{
  "suggestions": [...],
  "profile": {
    "riskProfile": "moderate",
    "investmentExperience": "beginner"
  },
  "financialSummary": {
    "monthlyIncome": 5000,
    "savingsCapacity": 1500,
    "healthScore": 65
  }
}
```

### POST /api/investments/goals
Adiciona objetivo financeiro.

**Body:**
```json
{
  "name": "Viagem",
  "type": "short-term",
  "targetAmount": 10000,
  "deadline": "2026-06-01",
  "priority": 3
}
```

### GET /api/investments/quiz
Retorna perguntas do quiz de perfil.

## 🧮 Algoritmo de Recomendações

### 1. Verificação de Reserva

```javascript
if (!hasEmergencyFund || emergencyFundAmount < target) {
  // SEMPRE sugere reserva primeiro
  priority = 5;
  suggestedAmount = min(needed, savingsCapacity);
}
```

### 2. Alocação por Perfil

**Conservador:**
- 60% Tesouro Selic
- 30% CDB
- 10% Reserva adicional

**Moderado:**
- 40% CDB
- 30% Tesouro IPCA
- 20% Tesouro Selic
- 10% Fundos

**Arrojado:**
- 30% LCI/LCA (se tiver capital)
- 30% Fundos Multimercado
- 20% Tesouro IPCA
- 20% CDB

### 3. Ajuste por Objetivos

```javascript
if (goal.deadline < 12 months) {
  // Curto prazo: alta liquidez
  product = 'tesouro-selic';
} else if (goal.deadline < 36 months) {
  // Médio prazo: balanceado
  product = riskProfile === 'aggressive' ? 'tesouro-ipca' : 'cdb';
} else {
  // Longo prazo: crescimento
  product = riskProfile === 'aggressive' ? 'fundo-multimercado' : 'tesouro-ipca';
}
```

### 4. Cálculo de Match Score

```javascript
matchScore = baseScore;

// Ajusta por liquidez
if (needsLiquidity && liquidity !== 'immediate') matchScore -= 10;

// Ajusta por risco
if (riskProfile === 'conservative' && riskLevel > 2) matchScore -= 20;

// Ajusta por valor mínimo
if (availableAmount < minimumInvestment) matchScore = 0;

// Ajusta por objetivo
if (hasRelatedGoal) matchScore += 15;
```

## 🎨 Interface do Usuário

### 1. Quiz de Perfil

Modal interativo com:
- Progress bar visual
- 6 perguntas essenciais
- Validação em tempo real
- Navegação back/forward

### 2. Dashboard Resumo

4 cards principais:
- **Perfil**: Tipo de investidor
- **Capacidade**: Quanto pode poupar
- **Saúde**: Score financeiro
- **Reserva**: Progresso da emergência

### 3. Cards de Investimento

Cada card mostra:
- Nome e descrição do produto
- Badge de prioridade
- Rentabilidade anual esperada
- Indicador visual de risco (5 dots)
- Liquidez
- Valor sugerido vs mínimo
- Barra de adequação (match score)
- Motivo da recomendação
- Prós e contras
- Badges informativos (IR, FGC, indexador)
- Objetivo relacionado

### 4. Cores por Prioridade

- **Máxima (5)**: Vermelho #f56565
- **Alta (4)**: Laranja #ed8936
- **Média (3)**: Azul #4299e1
- **Baixa (1-2)**: Verde #48bb78

### 5. Indicador de Risco

5 dots coloridos:
- 1 dot: Verde (muito baixo)
- 2 dots: Azul (baixo)
- 3 dots: Laranja (moderado)
- 4+ dots: Vermelho (alto)

## 💡 Lógica de Negócio

### Score de Saúde Financeira (0-100)

```javascript
// Taxa de poupança (40 pontos)
if (savingsRate >= 30) score += 40;
else if (savingsRate >= 20) score += 30;
else if (savingsRate >= 10) score += 20;

// Reserva de emergência (30 pontos)
if (coverage >= 100%) score += 30;
else if (coverage >= 75%) score += 25;
else if (coverage >= 50%) score += 20;

// Razão renda/gastos (30 pontos)
if (ratio >= 2.0) score += 30;
else if (ratio >= 1.5) score += 25;
else if (ratio >= 1.2) score += 20;
```

### Ratings

- 80-100: **Excelente** 🌟
- 60-79: **Boa** ✅
- 40-59: **Regular** ⚠️
- 20-39: **Precisa Melhorar** 📉
- 0-19: **Crítica** 🚨

## 🔍 Exemplos de Uso

### Exemplo 1: Usuário Sem Reserva

**Input:**
- Renda: R$ 5.000/mês
- Gastos: R$ 3.500/mês
- Perfil: Moderado
- Reserva: R$ 0

**Output:**
1. **Prioridade Máxima**: Reserva de Emergência
   - Sugerido: R$ 1.500/mês
   - Meta: R$ 21.000 (6 meses)
   - Prazo: 14 meses

### Exemplo 2: Usuário Com Reserva

**Input:**
- Renda: R$ 8.000/mês
- Gastos: R$ 5.000/mês
- Perfil: Arrojado
- Reserva: R$ 20.000 ✅
- Disponível: R$ 3.000/mês

**Output:**
1. **LCI/LCA** - R$ 1.000 (33%)
   - 10,8% a.a., Isento IR
   - Match: 85%

2. **Fundo Multimercado** - R$ 1.000 (33%)
   - 14% a.a., Gestão ativa
   - Match: 80%

3. **Tesouro IPCA+** - R$ 600 (20%)
   - 13,5% a.a., Proteção inflação
   - Match: 75%

4. **CDB** - R$ 400 (14%)
   - 12,5% a.a., FGC
   - Match: 70%

### Exemplo 3: Objetivo Específico

**Input:**
- Objetivo: Viagem em 18 meses
- Meta: R$ 12.000
- Perfil: Conservador

**Output:**
1. **Tesouro Selic** - R$ 667/mês
   - Prazo: 18 meses
   - Liquidez diária
   - Risco baixíssimo
   - Ideal para curto prazo

## 📊 Dados dos Produtos

| Produto | Rentabilidade | Risco | Liquidez | Mínimo | IR | FGC |
|---------|---------------|-------|----------|--------|----|----|
| Reserva Emergência | 10,5% | 1 | Imediata | R$ 0 | Não | Sim |
| Tesouro Selic | 11% | 1 | Diária | R$ 30 | Sim | Não |
| CDB | 12,5% | 2 | Vencimento | R$ 1.000 | Sim | Sim |
| Tesouro IPCA+ | 13,5% | 2 | Diária* | R$ 30 | Sim | Não |
| LCI/LCA | 10,8% | 2 | Vencimento | R$ 5.000 | Não | Sim |
| Fundo RF | 11,5% | 2 | Diária | R$ 100 | Sim | Não |
| Fundo Multi | 14% | 3 | Mensal | R$ 500 | Sim | Não |

*Liquidez diária com marcação a mercado

## 🚀 Como Usar

### 1. Configurar Perfil

```
1. Acesse /investments
2. Complete o quiz (6 perguntas)
3. Perfil salvo automaticamente
```

### 2. Gerar Sugestões

```
1. Clique em "Gerar Sugestões"
2. Sistema analisa suas finanças
3. Recebe recomendações personalizadas
```

### 3. Adicionar Objetivos

```
1. Edite seu perfil
2. Adicione metas financeiras
3. Receba sugestões alinhadas aos objetivos
```

### 4. Acompanhar Progresso

```
1. Dashboard mostra saúde financeira
2. Veja progresso da reserva
3. Acompanhe capacidade de poupança
```

## ⚙️ Configuração

### Instalar Dependências

```bash
cd server
# Sem dependências extras necessárias
```

### Iniciar Servidor

```bash
npm run dev
```

### Acessar Interface

```
http://localhost:3000/investments
```

## 🔒 Regras de Negócio

1. **Reserva SEMPRE primeiro**: Até 100% da meta
2. **Respeita valor mínimo**: Não sugere se < mínimo
3. **Adequação ao perfil**: Match score mínimo 60%
4. **Diversificação**: Múltiplos produtos
5. **Prazo alinhado**: Produtos compatíveis com objetivo
6. **Liquidez adequada**: Emergência = imediata
7. **FGC para conservadores**: Prioriza produtos cobertos

## 🎯 Métricas de Sucesso

- **Taxa de adoção**: % usuários que completam perfil
- **Engajamento**: Visitas à página de investimentos
- **Conversão**: % que clicam em "Saiba Mais"
- **Satisfação**: Score médio de adequação
- **Educação**: Usuários que entendem produtos

## 📚 Recursos Educacionais

Cada produto inclui:
- ✅ Descrição clara
- ✅ Vantagens e desvantagens
- ✅ Informações sobre tributação
- ✅ Cobertura FGC
- ✅ Tipo de indexador
- ✅ Explicação do motivo da sugestão

## 🔮 Melhorias Futuras

- [ ] Simulador de rentabilidade
- [ ] Comparação com inflação
- [ ] Histórico de rentabilidade real
- [ ] Alertas de oportunidades
- [ ] Integração com corretoras (API)
- [ ] Acompanhamento de carteira
- [ ] Rebalanceamento automático
- [ ] Produtos de renda variável (ações)
- [ ] Previdência privada (PGBL/VGBL)
- [ ] Criptomoedas para arrojados
- [ ] Calculadora de IR
- [ ] Simulador de aposentadoria

## 📖 Documentação Adicional

- [Alertas Financeiros](ALERTAS_FINANCEIROS.md)
- [Previsões ML](PREVISOES_ML.md)
- [API ML](ml-api/README.md)

## 🎉 Conclusão

Sistema completo de sugestões de investimentos implementado com sucesso!

**Destaques:**
- ✅ Análise financeira automática
- ✅ 7 produtos diferentes
- ✅ Algoritmo inteligente de recomendações
- ✅ Interface intuitiva com quiz
- ✅ Cards visuais detalhados
- ✅ Sistema de priorização
- ✅ Match score personalizado
- ✅ Educação financeira integrada

O usuário agora tem acesso a recomendações profissionais baseadas em sua realidade financeira! 🚀💰
