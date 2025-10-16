# Sistema de Alertas Financeiros

## Visão Geral

Sistema completo de alertas financeiros que monitora os gastos por categoria e notifica o usuário quando os limites são atingidos ou ultrapassados.

## Funcionalidades Implementadas

### 1. **Modelo de Dados Aprimorado** (`server/models/Budget.js`)

O modelo de orçamento foi expandido com os seguintes campos:

- **warningThreshold**: Porcentagem do limite em que o alerta começa (padrão: 80%)
- **alertEnabled**: Habilita/desabilita alertas para o orçamento
- **period**: Define o período do orçamento (semanal, mensal, anual)
- **updatedAt**: Timestamp da última atualização

### 2. **API Endpoints** (`server/routes/api/budgets.js`)

#### GET `/api/budgets/stats`
Retorna estatísticas detalhadas de todos os orçamentos:
- Gastos totais vs limite
- Porcentagem utilizada
- Status (ok, warning, exceeded)
- Valor restante

#### GET `/api/budgets/alerts`
Retorna alertas ativos com base nos limites configurados:
- Filtra orçamentos que atingiram o threshold de alerta
- Classifica por severidade (danger, warning)
- Calcula períodos baseados na configuração (semanal/mensal/anual)
- Ordena por severidade e porcentagem

#### POST `/api/budgets`
Cria ou atualiza orçamentos com novos parâmetros:
- Aceita warningThreshold, alertEnabled, period
- Usa upsert para evitar duplicatas

### 3. **Interface de Configuração** (`client/src/pages/BudgetAlertsPage.jsx`)

Página completa para gerenciar orçamentos com:

#### Formulário de Criação/Edição:
- Campo de categoria
- Limite de gastos (R$)
- Threshold de alerta (%)
- Período (semanal/mensal/anual)
- Toggle para habilitar/desabilitar alertas

#### Visualização de Orçamentos:
- Cards com informações detalhadas
- Barra de progresso visual colorida
- Indicadores de status (✅ OK, ⚠️ Alerta, 🚨 Excedido)
- Informações de gastos e saldo restante
- Ações de edição

### 4. **Componentes Visuais**

#### BudgetAlert (`client/src/components/BudgetAlert.jsx`)
Componente de alerta reutilizável com:
- Ícones animados baseados em severidade
- Detalhes expandíveis (limite, gasto, restante)
- Barra de progresso integrada
- Informações de período
- Botão de dispensa

#### Toast (`client/src/components/Toast.jsx`)
Sistema de notificações flutuantes:
- Tipos: info, success, warning, danger, error
- Duração configurável
- Animações suaves
- Auto-dispensável
- Barra de progresso visual

### 5. **Dashboard Melhorado** (`client/src/pages/DashboardPage.jsx`)

#### Resumo Estatístico:
- **Orçamento Total**: Soma de todos os limites
- **Total Gasto**: Soma de todas as despesas
- **Saldo Restante**: Diferença entre limite e gasto
- **Status**: Contadores por categoria (Excedidos, Alerta, OK)

#### Seção de Alertas Ativos:
- Lista todos os alertas críticos
- Alertas dispensáveis individualmente
- Mensagens detalhadas

#### Visão Rápida por Categoria:
- Grid com até 6 categorias principais
- Mini barras de progresso
- Status visual por cor

### 6. **Integração com Transações** (`client/src/pages/TransactionsPage.jsx`)

Ao criar uma transação:
- Verifica automaticamente se ultrapassa o orçamento
- Exibe toast de sucesso
- Se houver alerta de orçamento, exibe toast adicional com severidade apropriada
- Atualiza o sistema de alertas do App

## Estilos e Design

### Paleta de Cores:
- **Success/OK**: Verde (#48bb78)
- **Warning/Alerta**: Laranja (#ed8936)
- **Danger/Excedido**: Vermelho (#f56565)
- **Primary**: Azul (#4299e1)

### Animações:
- Slide in para alertas
- Pulse para ícones críticos
- Shimmer para barras de progresso
- Bounce para mensagens de sucesso

### Responsividade:
- Layout adaptativo para mobile
- Grid responsivo para cards
- Ajustes de fonte e espaçamento

## Como Usar

### 1. Configurar um Orçamento:

```
1. Acesse /budgets ou /alerts
2. Preencha o formulário:
   - Categoria: "Alimentação"
   - Limite: 1000.00
   - Alerta em: 80%
   - Período: Mensal
3. Clique em "Criar Orçamento"
```

### 2. Visualizar Alertas:

```
1. Acesse /dashboard
2. Veja os cards de resumo no topo
3. Alertas ativos aparecem logo abaixo
4. Visão rápida mostra todas as categorias
```

### 3. Criar Transação com Alerta:

```
1. Acesse /transactions
2. Adicione uma despesa na categoria configurada
3. Se ultrapassar o limite:
   - Toast de sucesso aparece primeiro
   - Toast de alerta aparece em seguida
   - Dashboard é atualizado automaticamente
```

## Estrutura de Arquivos

```
server/
├── models/
│   └── Budget.js (modelo aprimorado)
└── routes/api/
    └── budgets.js (rotas de stats e alerts)

client/src/
├── pages/
│   ├── BudgetAlertsPage.jsx (configuração de limites)
│   ├── BudgetAlertsPage.css
│   ├── DashboardPage.jsx (dashboard melhorado)
│   ├── DashboardPage.css
│   └── TransactionsPage.jsx (com alertas)
└── components/
    ├── BudgetAlert.jsx (componente de alerta)
    ├── BudgetAlert.css
    ├── Toast.jsx (notificações)
    └── Toast.css
```

## Melhorias Futuras

- [ ] Notificações por email quando limites são ultrapassados
- [ ] Histórico de alertas disparados
- [ ] Gráficos de tendência de gastos
- [ ] Previsão de quando o limite será atingido
- [ ] Alertas personalizados por dia da semana
- [ ] Comparativo com períodos anteriores
- [ ] Sugestões de economia baseadas em padrões

## Tecnologias Utilizadas

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, React Router
- **Estilização**: CSS3 com animações e gradientes
- **API**: RESTful com autenticação JWT

## Testes Recomendados

1. Criar orçamento com limite baixo
2. Adicionar transações até atingir 80% do limite (deve mostrar warning)
3. Adicionar mais transações até ultrapassar 100% (deve mostrar danger)
4. Verificar cálculos em diferentes períodos (semanal, mensal, anual)
5. Testar edição de orçamentos existentes
6. Verificar responsividade em diferentes dispositivos
7. Testar dispensar alertas no dashboard

## Suporte

Para problemas ou dúvidas sobre o sistema de alertas, verifique:
- Console do navegador para erros do frontend
- Logs do servidor para erros do backend
- Conexão com o MongoDB
- Autenticação JWT válida
