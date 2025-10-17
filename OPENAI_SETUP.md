# 🤖 Como Configurar a OpenAI API Key

Este guia mostra como configurar a chave da OpenAI para usar o **GPT-4o Vision** na extração de dados de cupons fiscais.

---

## 📋 Índice
1. [Por que usar OpenAI?](#por-que-usar-openai)
2. [Obter chave da API](#obter-chave-da-api)
3. [Configuração Local (Desenvolvimento)](#configuração-local)
4. [Configuração no Render (Produção)](#configuração-no-render)
5. [Verificar se está funcionando](#verificar-funcionamento)
6. [Custos](#custos)

---

## 🎯 Por que usar OpenAI?

### **Com OpenAI GPT-4o Vision:**
- ✅ **95%+ de precisão** na extração
- ✅ Extrai **TODOS os produtos** (não apenas o total)
- ✅ Entende **contexto visual** do cupom
- ✅ Ignora automaticamente formas de pagamento, totais, metadados
- ✅ Funciona com **imagens de baixa qualidade**
- ✅ Valida e corrige erros comuns

### **Sem OpenAI (Tesseract apenas):**
- ⚠️ ~60-70% de precisão
- ⚠️ Pode confundir produtos com pagamentos
- ⚠️ Sensível a qualidade da imagem
- ⚠️ Requer pré-processamento intenso

**Resultado:** Com OpenAI, o `method` no response será `"openai"` (melhor qualidade)

---

## 🔑 Obter Chave da API

### Passo 1: Criar conta na OpenAI
1. Acesse: https://platform.openai.com/signup
2. Crie sua conta (pode usar Google/Microsoft)

### Passo 2: Adicionar método de pagamento
1. Acesse: https://platform.openai.com/settings/organization/billing/overview
2. Clique em "Add payment method"
3. Adicione um cartão de crédito
   - **Importante:** OpenAI cobra apenas pelo uso real (pay-as-you-go)
   - Você pode definir um limite de gastos

### Passo 3: Gerar API Key
1. Acesse: https://platform.openai.com/api-keys
2. Clique em "**+ Create new secret key**"
3. Dê um nome: `SaveMyMoney OCR`
4. **COPIE A CHAVE IMEDIATAMENTE** (só aparece uma vez!)
   - Formato: `sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

⚠️ **IMPORTANTE:** Guarde a chave em local seguro! Ela NÃO pode ser recuperada depois.

---

## 💻 Configuração Local (Desenvolvimento)

### Método 1: Usando arquivo .env (Recomendado)

1. **Navegue até a pasta do servidor:**
   ```bash
   cd server
   ```

2. **Abra o arquivo `.env`** (se não existir, crie):
   ```bash
   # Windows
   notepad .env

   # Mac/Linux
   nano .env
   ```

3. **Adicione a chave da OpenAI:**
   ```env
   # OpenAI API Key - For GPT-4o Vision OCR
   OPENAI_API_KEY=sk-proj-ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ
   ```

   ⚠️ Substitua `sk-proj-ABC123...` pela sua chave real!

4. **Salve o arquivo** (Ctrl+S / Cmd+S)

5. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

### Método 2: Variável de ambiente temporária (Teste rápido)

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY="sk-proj-ABC123DEF456..."
npm run dev
```

**Mac/Linux (Terminal):**
```bash
export OPENAI_API_KEY="sk-proj-ABC123DEF456..."
npm run dev
```

⚠️ **Nota:** Este método é temporário e só funciona na sessão atual do terminal.

---

## ☁️ Configuração no Render (Produção)

### Passo 1: Acessar o Dashboard do Render
1. Acesse: https://dashboard.render.com
2. Faça login
3. Selecione o serviço **SaveMyMoney Backend**

### Passo 2: Adicionar Environment Variable

1. No menu lateral, clique em **"Environment"**

2. Clique em **"Add Environment Variable"**

3. Preencha os campos:
   ```
   Key:   OPENAI_API_KEY
   Value: sk-proj-ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ
   ```

4. Clique em **"Save Changes"**

### Passo 3: Deploy automático
- O Render irá **redeployar automaticamente** o serviço
- Aguarde 2-3 minutos para o deploy completar

### Passo 4: Verificar logs
1. Clique em **"Logs"** no menu lateral
2. Procure por:
   ```
   🔍 Starting Advanced OCR extraction...
   📋 Extraction strategy: GPT-4o Vision (primary) → Tesseract + Parser (fallback)
   [1/2] 🤖 Attempting GPT-4o Vision extraction...
   ```

---

## ✅ Verificar Funcionamento

### 1. Verificar nos Logs do Servidor

**Quando a chave ESTÁ configurada:**
```
[1/2] 🤖 Attempting GPT-4o Vision extraction...
[OpenAI] Raw response: {...}
✅ SUCCESS: GPT-4o Vision extracted 2 items
✓ Using GPT-4o Vision result (highest quality - no Tesseract needed)
📊 Method: openai, Confidence: high
```

**Quando a chave NÃO está configurada:**
```
[1/2] 🤖 Attempting GPT-4o Vision extraction...
[OpenAI] API key not configured, skipping...
⚠️ GPT-4o Vision unavailable or failed, falling back to Tesseract + Parser...
```

### 2. Testar com Upload de Cupom

1. Faça upload de um cupom fiscal
2. Verifique o campo `method` na resposta:
   - ✅ `"openai"` → Usando GPT-4o Vision (sucesso!)
   - ⚠️ `"parser"` → Usando Tesseract (chave não configurada ou erro)

### 3. Verificar no Response JSON

```json
{
  "items": [
    {
      "description": "BISN SEVEN BOYS 300G TRAD",
      "amount": 5.49,
      "quantity": 1
    }
  ],
  "metadata": {
    "establishment": "COMERCIAL ZARAGOZA",
    "total": 78.96
  },
  "method": "openai",          ← Aqui! Deve ser "openai"
  "confidence": "high"
}
```

---

## 💰 Custos

### Preços da OpenAI (GPT-4o)

**Modelo:** `gpt-4o` (GPT-4 with vision)

| Item | Preço |
|------|-------|
| **Input** (imagem) | $2.50 / 1M tokens |
| **Output** (JSON) | $10.00 / 1M tokens |

### Custo Real por Cupom Fiscal

**Estimativa por cupom:**
- Input: ~1,000 tokens (imagem de cupom)
- Output: ~500 tokens (JSON com produtos)

**Cálculo:**
```
Input:  1,000 tokens × $2.50/1M = $0.0025
Output:   500 tokens × $10.00/1M = $0.0050
TOTAL por cupom: ~$0.0075 (menos de 1 centavo!)
```

**Em Reais (câmbio R$5.00):**
- 1 cupom = R$ 0,0375 (~3,7 centavos)
- 100 cupons = R$ 3,75
- 1.000 cupons = R$ 37,50

### Exemplo de Uso Mensal

| Cenário | Cupons/mês | Custo/mês USD | Custo/mês BRL |
|---------|------------|---------------|---------------|
| Pessoal | 50 | $0.38 | R$ 1,90 |
| Pequeno | 500 | $3.75 | R$ 18,75 |
| Médio | 2.000 | $15.00 | R$ 75,00 |
| Grande | 10.000 | $75.00 | R$ 375,00 |

### Definir Limite de Gastos

**Recomendado:** Configure um limite para evitar surpresas!

1. Acesse: https://platform.openai.com/settings/organization/limits
2. Clique em "**Usage limits**"
3. Defina um limite mensal (ex: $10.00)
4. OpenAI irá parar de processar quando atingir o limite

---

## 🔒 Segurança

### ⚠️ NUNCA faça isso:

❌ **NÃO commite a chave no Git:**
```env
# ❌ ERRADO - arquivo .env commitado
OPENAI_API_KEY=sk-proj-abc123...
```

❌ **NÃO exponha a chave no frontend:**
```javascript
// ❌ ERRADO - chave no código JavaScript
const apiKey = "sk-proj-abc123...";
```

### ✅ Boas práticas:

✅ **Use variáveis de ambiente:**
```javascript
// ✅ CORRETO - no servidor
const apiKey = process.env.OPENAI_API_KEY;
```

✅ **Adicione `.env` no `.gitignore`:**
```gitignore
# .gitignore
.env
.env.local
```

✅ **Use o arquivo `.env.example` como template:**
```env
# .env.example (pode commitar)
OPENAI_API_KEY=sk-proj-your-key-here
```

---

## 🐛 Troubleshooting

### Problema: "OpenAI API key not configured"

**Solução:**
1. Verifique se a chave está no `.env`
2. Verifique se o arquivo `.env` está na pasta `server/`
3. Reinicie o servidor: `npm run dev`

### Problema: "Invalid API Key"

**Possíveis causas:**
- Chave copiada incorretamente (espaços, quebras de linha)
- Chave foi revogada na OpenAI
- Método de pagamento inválido/expirado

**Solução:**
1. Gere uma nova chave: https://platform.openai.com/api-keys
2. Verifique método de pagamento: https://platform.openai.com/settings/organization/billing

### Problema: "Rate limit exceeded"

**Causa:** Muitas requisições em pouco tempo

**Solução:**
1. Aguarde 1 minuto
2. Configure rate limiting no backend
3. Considere upgrade do plano OpenAI

### Problema: "Insufficient credits"

**Causa:** Créditos da OpenAI acabaram

**Solução:**
1. Adicione créditos: https://platform.openai.com/settings/organization/billing
2. Configure auto-recarga (auto-recharge)

---

## 📞 Suporte

**Dúvidas sobre OpenAI:**
- Documentação: https://platform.openai.com/docs
- Status: https://status.openai.com
- Suporte: https://help.openai.com

**Dúvidas sobre SaveMyMoney:**
- Issues: https://github.com/anibalssilva/SaveMyMoney/issues

---

## 📝 Resumo Rápido

```bash
# 1. Obter chave
https://platform.openai.com/api-keys

# 2. Configurar localmente
cd server
echo "OPENAI_API_KEY=sk-proj-ABC123..." >> .env

# 3. Reiniciar servidor
npm run dev

# 4. Testar upload de cupom
# Verificar nos logs: method: "openai"
```

**Pronto! Agora o GPT-4o Vision está configurado e funcionando! 🎉**
