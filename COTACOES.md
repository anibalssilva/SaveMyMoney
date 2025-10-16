# Sistema de Cotações em Tempo Real 📊

## Visão Geral

O SaveMyMoney integra cotações em tempo real de ações, índices e moedas através de APIs de mercado financeiro. O sistema exibe um ticker animado no rodapé da aplicação com atualizações periódicas.

## Características

### 🎯 Funcionalidades Principais

- **Cotações em Tempo Real**: Preços atualizados de ações brasileiras, índices e moedas
- **Auto-Refresh**: Atualização automática a cada 60 segundos
- **Ticker Animado**: Scrolling horizontal suave e contínuo
- **Cache Inteligente**: Sistema de cache com TTL de 1 minuto para otimizar chamadas à API
- **Múltiplas Fontes**: Suporte para Brapi (gratuito) e Yahoo Finance (via RapidAPI)
- **Fallback Automático**: Se Brapi falhar, tenta Yahoo Finance automaticamente
- **Indicadores Visuais**: Cores e ícones para variações positivas (verde ▲) e negativas (vermelho ▼)

### 📱 Interface

- **Design Responsivo**: Adaptado para desktop e mobile
- **Hover Interativo**: Pausa a animação ao passar o mouse
- **Acessibilidade**: Suporte para prefers-reduced-motion
- **Estados Visuais**: Loading, erro e exibição normal

## Arquitetura

### Backend (Node.js)

#### MarketDataService (`server/services/marketDataService.js`)

Serviço principal que gerencia todas as operações de dados de mercado:

```javascript
class MarketDataService {
  constructor() {
    this.cache = new Map();           // Cache em memória
    this.cacheDuration = 60000;       // 1 minuto
    this.brapiBaseUrl = 'https://brapi.dev/api';
    this.yahooFinanceKey = process.env.YAHOO_FINANCE_KEY || '';
  }
}
```

**Métodos Principais:**

- `fetchQuote(symbol)` - Busca cotação de um símbolo específico
- `fetchQuotes(symbols)` - Busca múltiplas cotações em paralelo
- `fetchFromBrapi(symbol)` - Busca via API Brapi (gratuita)
- `fetchFromYahoo(symbol)` - Busca via Yahoo Finance (RapidAPI)
- `getMarketSummary()` - Resumo do mercado (índices + ações principais)
- `getBrazilianIndices()` - Lista de índices brasileiros
- `getCurrencyRates()` - Taxas de câmbio
- `searchSymbol(query)` - Busca por símbolos
- `clearCache()` - Limpa o cache manualmente
- `cleanCache()` - Remove entradas expiradas (automático a cada 5 min)

#### Rotas da API (`server/routes/api/market.js`)

Endpoints REST para acesso aos dados de mercado:

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/market/ticker` | Dados para ticker (BVSP, USDBRL, PETR4, VALE3) |
| GET | `/api/market/quote/:symbol` | Cotação de um símbolo específico |
| POST | `/api/market/quotes` | Cotações de múltiplos símbolos |
| GET | `/api/market/summary` | Resumo do mercado |
| GET | `/api/market/indices` | Índices brasileiros |
| GET | `/api/market/currencies` | Taxas de câmbio |
| GET | `/api/market/search/:query` | Busca por símbolos |
| DELETE | `/api/market/cache` | Limpa o cache (admin) |

**Exemplo de Resposta do Ticker:**

```json
{
  "tickers": [
    {
      "symbol": "BVSP",
      "displayName": "Ibovespa",
      "price": 125432.50,
      "change": 1250.30,
      "changePercent": 1.01,
      "isPositive": true
    },
    {
      "symbol": "USDBRL",
      "displayName": "Dólar",
      "price": 5.15,
      "change": -0.02,
      "changePercent": -0.39,
      "isPositive": false
    }
  ],
  "timestamp": "2025-10-15T10:30:00.000Z"
}
```

### Frontend (React)

#### MarketTicker Component (`client/src/components/MarketTicker.jsx`)

Componente visual que exibe o ticker animado:

**Props:**
- `refreshInterval` (number, default: 60000): Intervalo de atualização em ms

**Estados:**
- `tickers` - Array de cotações
- `loading` - Estado de carregamento
- `error` - Mensagem de erro

**Funcionalidades:**
- Auto-refresh com `useEffect` e `setInterval`
- Duplicação de conteúdo para scroll infinito
- Formatação de preços em pt-BR
- Indicadores visuais de variação

#### Estilos (`client/src/components/MarketTicker.css`)

**Animações:**
```css
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.ticker-content {
  animation: scroll 40s linear infinite;
}
```

**Responsividade:**
- Desktop: 40s de animação, espaçamento de 2rem
- Mobile (< 768px): 30s de animação, espaçamento de 1rem
- Reduced Motion: Animação desabilitada, scroll horizontal manual

## APIs Utilizadas

### 1. Brapi (Gratuita) ⭐ Recomendada

**Website:** https://brapi.dev

**Características:**
- ✅ Totalmente gratuita
- ✅ Sem necessidade de API key
- ✅ Dados de ações brasileiras (B3)
- ✅ Índices, moedas e criptomoedas
- ✅ Sem limite de requisições (uso justo)

**Símbolos Suportados:**
- Ações B3: `PETR4`, `VALE3`, `ITUB4`, `BBDC4`, `ABEV3`
- Índices: `^BVSP` (Ibovespa), `^IFIX` (Índice de Fundos Imobiliários)
- Moedas: `USDBRL=X`, `EURBRL=X`, `GBPBRL=X`
- Criptos: `BTC`, `ETH`

**Formato de Chamada:**
```bash
GET https://brapi.dev/api/quote/PETR4?range=1d&interval=1d
```

### 2. Yahoo Finance via RapidAPI (Opcional)

**Website:** https://rapidapi.com/apidojo/api/yahoo-finance1

**Características:**
- 💰 Requer API key (plano gratuito: 500 req/mês)
- 🌍 Dados globais de mercado
- 📊 Mais detalhes e histórico
- 🔄 Usado como fallback automático

**Configuração:**
1. Criar conta no RapidAPI
2. Subscrever a API Yahoo Finance
3. Adicionar a key no `.env`:
```env
YAHOO_FINANCE_KEY=your_rapidapi_key_here
```

## Configuração

### 1. Backend Setup

**Instalar dependências:**
```bash
cd server
npm install axios
```

**Configurar variáveis de ambiente (`.env`):**
```env
# Opcional - apenas se quiser usar Yahoo Finance como fallback
YAHOO_FINANCE_KEY=your_rapidapi_key_here
```

**Adicionar rota no `server/index.js`:**
```javascript
app.use('/api/market', require('./routes/api/market'));
```

### 2. Frontend Setup

**Instalar dependências:**
```bash
cd client
npm install axios
```

**Configurar URL da API no `.env`:**
```env
VITE_API_URL=http://localhost:5000
```

**Importar e usar o componente:**
```jsx
import MarketTicker from './components/MarketTicker';

function App() {
  return (
    <>
      <Navbar />
      <main>{/* Conteúdo */}</main>
      <MarketTicker refreshInterval={60000} />
    </>
  );
}
```

## Sistema de Cache

### Estratégia

O cache em memória otimiza o desempenho e reduz chamadas desnecessárias às APIs:

**Características:**
- TTL (Time To Live): 1 minuto
- Chave de cache: `{source}:{symbol}` (ex: `brapi:PETR4`)
- Limpeza automática a cada 5 minutos
- Cache por fonte (Brapi e Yahoo separados)

**Fluxo:**
```
1. Requisição → Verifica cache
2. Cache válido? → Retorna dados em cache
3. Cache inválido/inexistente? → Busca na API → Armazena no cache → Retorna dados
```

**Implementação:**
```javascript
isCacheValid(key) {
  const cached = this.cache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < this.cacheDuration;
}

getFromCache(key) {
  if (this.isCacheValid(key)) {
    return this.cache.get(key).data;
  }
  return null;
}

setCache(key, data) {
  this.cache.set(key, {
    data,
    timestamp: Date.now()
  });
}
```

## Personalização

### Alterar Símbolos do Ticker

Edite `server/routes/api/market.js`, endpoint `/ticker`:

```javascript
router.get('/ticker', async (req, res) => {
  // Customize os símbolos aqui:
  const symbols = ['^BVSP', 'USDBRL=X', 'PETR4.SA', 'VALE3.SA', 'ITUB4.SA'];
  const quotes = await marketDataService.fetchQuotes(symbols);
  // ...
});
```

### Alterar Intervalo de Atualização

No `App.jsx`:
```jsx
{/* Atualiza a cada 30 segundos */}
<MarketTicker refreshInterval={30000} />

{/* Atualiza a cada 2 minutos */}
<MarketTicker refreshInterval={120000} />
```

### Customizar Animação

No `MarketTicker.css`:
```css
.ticker-content {
  animation: scroll 40s linear infinite; /* Altere a duração aqui */
  gap: 2rem; /* Altere o espaçamento entre itens */
}
```

### Alterar Símbolos Padrão

No `server/services/marketDataService.js`, propriedade `defaultSymbols`:

```javascript
this.defaultSymbols = {
  indices: ['IBOV', 'IFIX', 'BVSP'],
  stocks: ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3'],
  currencies: ['USDBRL', 'EURBRL'],
  crypto: ['BTC', 'ETH']
};
```

## Tratamento de Erros

### Backend

O serviço implementa tratamento robusto de erros:

```javascript
async fetchQuote(symbol) {
  // 1. Tenta Brapi primeiro
  let quote = await this.fetchFromBrapi(symbol);

  // 2. Se falhar e Yahoo key disponível, usa Yahoo
  if (!quote && this.yahooFinanceKey) {
    quote = await this.fetchFromYahoo(symbol);
  }

  return quote; // Retorna null se ambos falharem
}
```

**Logs de Erro:**
- Console detalhado no desenvolvimento
- Mensagens genéricas para o cliente em produção

### Frontend

O componente possui 3 estados visuais:

1. **Loading**: Exibido na primeira carga
   ```jsx
   <div className="market-ticker loading">
     <span>Carregando cotações...</span>
   </div>
   ```

2. **Error**: Exibido se todas as requisições falharem
   ```jsx
   <div className="market-ticker error">
     <span>⚠️ Falha ao carregar cotações</span>
   </div>
   ```

3. **Normal**: Exibe os tickers normalmente
   - Mantém dados antigos se refresh falhar
   - Log de erros no console

## Performance

### Otimizações Implementadas

1. **Cache em Memória**: Reduz chamadas à API
2. **Requisições Paralelas**: `Promise.all()` para múltiplos símbolos
3. **Debounce Implícito**: TTL de 1 minuto evita spam
4. **Limpeza Automática**: Remove cache antigo a cada 5 min
5. **CSS Animations**: Usa GPU para animações suaves
6. **Duplicação de Conteúdo**: Scroll infinito sem JavaScript

### Métricas Esperadas

- **Tempo de Resposta**: 200-500ms (com cache)
- **Tempo de Resposta**: 1-3s (sem cache, primeira requisição)
- **Uso de Memória**: ~1-5MB (cache com 50-100 símbolos)
- **Requisições/Minuto**: ~4 (ticker com 4 símbolos, refresh 60s)

## Testes

### Testar Endpoints Manualmente

**1. Ticker:**
```bash
curl http://localhost:5000/api/market/ticker
```

**2. Cotação individual:**
```bash
curl http://localhost:5000/api/market/quote/PETR4
```

**3. Múltiplas cotações:**
```bash
curl -X POST http://localhost:5000/api/market/quotes \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["PETR4", "VALE3", "ITUB4"]}'
```

**4. Busca:**
```bash
curl http://localhost:5000/api/market/search/petro
```

**5. Limpar cache:**
```bash
curl -X DELETE http://localhost:5000/api/market/cache
```

### Testar Frontend

1. Inicie o servidor: `cd server && npm start`
2. Inicie o cliente: `cd client && npm run dev`
3. Abra http://localhost:5173
4. Verifique o ticker no rodapé
5. Teste hover para pausar animação
6. Aguarde 60s para ver auto-refresh

### Testar Fallback

**Simular falha da Brapi:**

No `marketDataService.js`, force erro:
```javascript
async fetchFromBrapi(symbol) {
  throw new Error('Simulated error');
}
```

Verifique nos logs do servidor se Yahoo Finance é chamado.

## Troubleshooting

### Problema: Ticker não aparece

**Possíveis causas:**
1. Servidor backend não está rodando
2. URL da API incorreta no `.env`
3. CORS não configurado

**Solução:**
```bash
# 1. Verificar se backend está rodando
curl http://localhost:5000/api/ping

# 2. Verificar .env do frontend
cat client/.env
# Deve conter: VITE_API_URL=http://localhost:5000

# 3. Verificar CORS no server/index.js
# Deve ter: app.use(cors());
```

### Problema: Dados não atualizam

**Possíveis causas:**
1. Cache travado
2. API da Brapi fora do ar
3. Interval não funcionando

**Solução:**
```bash
# 1. Limpar cache
curl -X DELETE http://localhost:5000/api/market/cache

# 2. Testar Brapi diretamente
curl https://brapi.dev/api/quote/PETR4

# 3. Verificar console do navegador
# Deve mostrar requisições a cada 60s
```

### Problema: Símbolos não encontrados

**Possíveis causas:**
1. Símbolo incorreto
2. API não suporta o símbolo

**Solução:**

Para ações B3, adicione `.SA`:
```javascript
// Errado
const symbols = ['PETR4', 'VALE3'];

// Correto
const symbols = ['PETR4.SA', 'VALE3.SA'];
```

Para índices, use `^`:
```javascript
const indices = ['^BVSP', '^IFIX'];
```

Para moedas, use `=X`:
```javascript
const currencies = ['USDBRL=X', 'EURBRL=X'];
```

### Problema: Performance ruim

**Possíveis causas:**
1. Muitos símbolos no ticker
2. Intervalo de refresh muito curto
3. Cache não funcionando

**Solução:**
```javascript
// 1. Reduza número de símbolos
const symbols = ['^BVSP', 'USDBRL=X']; // Apenas 2

// 2. Aumente intervalo
<MarketTicker refreshInterval={120000} /> // 2 minutos

// 3. Verifique cache
console.log(marketDataService.cache.size); // Deve crescer
```

## Segurança

### Boas Práticas

1. **API Keys**: Sempre use variáveis de ambiente
   ```env
   # .env (NUNCA commitar!)
   YAHOO_FINANCE_KEY=secret_key
   ```

2. **Rate Limiting**: Implemente no backend (futuro)
   ```javascript
   const rateLimit = require('express-rate-limit');

   const limiter = rateLimit({
     windowMs: 1 * 60 * 1000, // 1 minuto
     max: 20 // 20 requisições por minuto
   });

   app.use('/api/market', limiter);
   ```

3. **Cache Público**: Endpoint de limpeza deve ser protegido
   ```javascript
   // Adicionar middleware de autenticação
   router.delete('/cache', authMiddleware, isAdmin, (req, res) => {
     marketDataService.clearCache();
   });
   ```

4. **Validação**: Validar símbolos antes de buscar
   ```javascript
   const validSymbol = /^[A-Z0-9^.=]+$/;
   if (!validSymbol.test(symbol)) {
     return res.status(400).json({ msg: 'Invalid symbol' });
   }
   ```

## Próximos Passos

### Melhorias Futuras

1. **Persistência de Cache**: Redis/Memcached para produção
2. **WebSockets**: Dados em tempo real sem polling
3. **Gráficos Interativos**: Charts com histórico
4. **Watchlist Personalizada**: Usuário escolhe símbolos
5. **Alertas de Preço**: Notificações quando atingir meta
6. **Análise Técnica**: Indicadores (RSI, MACD, Médias Móveis)
7. **Notícias Integradas**: Feed de notícias por símbolo
8. **Comparação de Ativos**: Lado a lado

### Integração com Investimentos

Conectar com o módulo de investimentos existente:

```javascript
// Buscar cotações dos investimentos do usuário
router.get('/portfolio/:userId', async (req, res) => {
  const investments = await Investment.find({ user: req.params.userId });
  const symbols = investments.map(inv => inv.symbol);
  const quotes = await marketDataService.fetchQuotes(symbols);

  // Calcular valor atual do portfólio
  const portfolioValue = investments.reduce((total, inv) => {
    const quote = quotes.find(q => q.symbol === inv.symbol);
    return total + (inv.quantity * (quote?.price || 0));
  }, 0);

  res.json({ investments, quotes, portfolioValue });
});
```

## Suporte

### Documentação das APIs

- **Brapi**: https://brapi.dev/docs
- **Yahoo Finance**: https://rapidapi.com/apidojo/api/yahoo-finance1

### Recursos

- [React Hooks](https://react.dev/reference/react)
- [Express.js](https://expressjs.com/)
- [Axios](https://axios-http.com/)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)

## Licença

Este módulo faz parte do SaveMyMoney e segue a mesma licença do projeto principal.

---

**Desenvolvido com ❤️ para ajudar você a acompanhar o mercado financeiro**
