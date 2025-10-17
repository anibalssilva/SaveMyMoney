/**
 * ADVANCED OCR SERVICE
 * Multi-method OCR with AI-powered validation
 * Combines: Tesseract.js + OpenAI GPT-4o Vision + Smart Parser
 */

const { createWorker } = require('tesseract.js');
const Jimp = require('jimp');
const OpenAI = require('openai');

// Initialize OpenAI (will be configured via env)
let openai = null;

function initializeOpenAI() {
  if (process.env.OPENAI_API_KEY && !openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
}

/**
 * Advanced image preprocessing with Jimp
 */
async function preprocessImage(buffer) {
  try {
    const image = await Jimp.read(buffer);

    // Step 1: Convert to grayscale
    image.grayscale();

    // Step 2: Increase contrast (helps with faded receipts)
    image.contrast(0.3);

    // Step 3: Normalize brightness
    image.normalize();

    // Step 4: Sharpen (improves text edges)
    image.convolute([
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0]
    ]);

    // Step 5: Auto-threshold (Otsu's method simulation)
    // This creates high contrast between text and background
    const threshold = await calculateOtsuThreshold(image);
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const gray = this.bitmap.data[idx];
      const newValue = gray > threshold ? 255 : 0;
      this.bitmap.data[idx] = newValue;     // R
      this.bitmap.data[idx + 1] = newValue; // G
      this.bitmap.data[idx + 2] = newValue; // B
    });

    // Step 6: Denoise (remove small artifacts)
    image.blur(1);

    // Step 7: Scale up for better OCR (2x)
    image.scale(2);

    return await image.getBufferAsync(Jimp.MIME_PNG);
  } catch (error) {
    console.error('Image preprocessing error:', error);
    return buffer; // Return original if preprocessing fails
  }
}

/**
 * Calculate Otsu's threshold for binarization
 */
async function calculateOtsuThreshold(image) {
  const histogram = new Array(256).fill(0);
  const total = image.bitmap.width * image.bitmap.height;

  // Build histogram
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const gray = this.bitmap.data[idx];
    histogram[gray]++;
  });

  // Calculate threshold using Otsu's method
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let maxVariance = 0;
  let threshold = 0;

  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;

    wF = total - wB;
    if (wF === 0) break;

    sumB += i * histogram[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }

  return threshold;
}

/**
 * Extract text using Tesseract.js with optimized settings
 */
async function extractWithTesseract(imageBuffer) {
  const worker = await createWorker('por', 1, {
    logger: m => console.log('[Tesseract]', m.status, m.progress),
  });

  try {
    // Configure Tesseract for Brazilian receipts
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜàáâãäåçèéêëìíîïñòóôõöùúûü ,.-+*xXR$%()/',
      tessedit_pageseg_mode: '6', // Uniform block of text
      preserve_interword_spaces: '1',
    });

    const { data: { text, confidence } } = await worker.recognize(imageBuffer);

    console.log(`[Tesseract] Confidence: ${confidence.toFixed(2)}%`);
    console.log(`[Tesseract] Extracted text length: ${text.length} characters`);

    return { text, confidence, method: 'tesseract' };
  } catch (error) {
    console.error('[Tesseract] Error:', error);
    return { text: '', confidence: 0, method: 'tesseract', error: error.message };
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract COMPLETE receipt data including ALL items using OpenAI GPT-4o Vision
 * Enhanced prompt to extract individual products, not just payment totals
 */
async function extractWithOpenAI(imageBuffer) {
  console.log('[OpenAI] Initializing...');
  console.log('[OpenAI] API Key present:', !!process.env.OPENAI_API_KEY);
  console.log('[OpenAI] API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
  console.log('[OpenAI] API Key preview:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : 'NONE');

  initializeOpenAI();

  if (!openai) {
    console.error('[OpenAI] ❌ API key not configured! Set OPENAI_API_KEY environment variable.');
    console.error('[OpenAI] ❌ Falling back to Tesseract + Parser (lower accuracy)');
    console.error('[OpenAI] 📖 See OPENAI_SETUP.md for configuration instructions');
    return null;
  }

  console.log('[OpenAI] ✓ OpenAI client initialized successfully');

  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    console.log('[OpenAI] Image converted to base64, size:', Math.round(base64Image.length / 1024), 'KB');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // GPT-4o with vision - best for OCR
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em OCR de cupons fiscais brasileiros (NFC-e, SAT, Nota Paulista).

SUA ÚNICA TAREFA: Extrair TODOS os produtos comprados (nome + valor individual de cada item).

REGRAS CRÍTICAS:
1. NÃO extraia formas de pagamento como se fossem produtos
2. NÃO extraia totais/subtotais como produtos
3. NÃO extraia códigos de barras isolados
4. SEMPRE valide: soma dos itens ≈ total do cupom`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analise esta imagem de cupom fiscal e extraia TODOS os produtos comprados.

═══════════════════════════════════════════════════════════════════
📋 ESTRUTURAS COMUNS DE PRODUTOS EM CUPONS BRASILEIROS
═══════════════════════════════════════════════════════════════════

TIPO 1 - Código e descrição em linhas separadas:
┌───────────────────────────────────────────────────────────────┐
│ 001  7891234567890 PRODUTO EXEMPLO MARCA 500G                 │
│                         1 UN  x  12,50  =           12,50     │
└───────────────────────────────────────────────────────────────┘
📌 EXTRAIR: "PRODUTO EXEMPLO MARCA 500G" → 12.50

TIPO 2 - Descrição e valor na mesma linha:
┌───────────────────────────────────────────────────────────────┐
│ 002  ARROZ BRANCO 5KG         2 UN x 25,90          51,80     │
└───────────────────────────────────────────────────────────────┘
📌 EXTRAIR: "ARROZ BRANCO 5KG" → 51.80

TIPO 3 - Tabela estruturada:
┌───────────────────────────────────────────────────────────────┐
│ ITEM  CODIGO  DESCRICAO              QTD  VL.UNIT  VL.TOTAL   │
│ 001   789123  FEIJAO PRETO 1KG       1    8,99     8,99       │
│ 002   456789  MACARRAO INTEGRAL 500G 3    4,50     13,50      │
└───────────────────────────────────────────────────────────────┘
📌 EXTRAIR:
  - "FEIJAO PRETO 1KG" → 8.99
  - "MACARRAO INTEGRAL 500G" → 13.50

═══════════════════════════════════════════════════════════════════
⚠️ SEÇÕES QUE NÃO SÃO PRODUTOS (IGNORAR COMPLETAMENTE)
═══════════════════════════════════════════════════════════════════

❌ Seção de Pagamento:
   FORMA DE PAGAMENTO       VALOR PAGO
   PIX                      150,00
   CARTEIRA DIGITAL         150,00
   DEBITO MASTERCARD        150,00

❌ Seção de Totais:
   SUBTOTAL              R$ 145,50
   DESCONTO              R$   5,00
   TOTAL A PAGAR         R$ 140,50
   Qtd. Total de Itens        15

❌ Informações Fiscais:
   NFC-e: 000012345 Serie 1
   Protocolo de Autorização: XYZ123
   Consulte pela Chave de Acesso em...

═══════════════════════════════════════════════════════════════════
✅ EXEMPLO COMPLETO - EXTRAÇÃO CORRETA
═══════════════════════════════════════════════════════════════════

CUPOM FISCAL EXEMPLO:

SUPERMERCADO BOM PREÇO LTDA
CNPJ: 12.345.678/0001-99
Data: 17/10/2025  Hora: 15:30

──────────────────────────────────────────────────────────────────
ITEM  CODIGO       DESCRICAO                 QTD  VL.UN   VL.TOTAL
──────────────────────────────────────────────────────────────────
001   7891000100103
      LEITE INTEGRAL 1L MARCA A              2    5,99    11,98

002   7891000100207
      CAFE TORRADO 500G MARCA B              1    18,90   18,90

003   PÃOZINHO FRANCES                       10   0,60    6,00
──────────────────────────────────────────────────────────────────
Qtd. Total de Itens: 3
SUBTOTAL                                             R$ 36,88
──────────────────────────────────────────────────────────────────
FORMA DE PAGAMENTO                           VALOR PAGO
CARTAO DEBITO                                       36,88
──────────────────────────────────────────────────────────────────

JSON CORRETO A SER RETORNADO:

{
  "items": [
    {
      "description": "LEITE INTEGRAL 1L MARCA A",
      "amount": 11.98,
      "quantity": 2
    },
    {
      "description": "CAFE TORRADO 500G MARCA B",
      "amount": 18.90,
      "quantity": 1
    },
    {
      "description": "PÃOZINHO FRANCES",
      "amount": 6.00,
      "quantity": 10
    }
  ],
  "metadata": {
    "establishment": "SUPERMERCADO BOM PREÇO LTDA",
    "cnpj": "12.345.678/0001-99",
    "date": "17/10/2025",
    "time": "15:30",
    "total": 36.88,
    "paymentMethod": {
      "type": "debit",
      "details": "CARTAO DEBITO"
    }
  },
  "confidence": "high",
  "notes": "3 items extracted. Sum validation: 11.98 + 18.90 + 6.00 = 36.88 ✓"
}

═══════════════════════════════════════════════════════════════════
🔍 PROCESSO DE EXTRAÇÃO - PASSO A PASSO
═══════════════════════════════════════════════════════════════════

PASSO 1: Localize a seção de produtos
  → Procure por cabeçalhos: "ITEM", "CODIGO", "DESCRICAO", "PRODUTO"
  → Produtos geralmente vêm ANTES de "TOTAL", "FORMA DE PAGAMENTO"

PASSO 2: Identifique cada produto
  → Produtos têm descrições em MAIÚSCULAS (geralmente)
  → Produtos têm códigos de barras (13 dígitos) OU números de item (001, 002)
  → Produtos têm quantidade (UN, PC, KG) e valores monetários

PASSO 3: Para cada produto encontrado:
  a) Extraia a DESCRIÇÃO (sem código de barras, sem número do item)
  b) Extraia o VALOR TOTAL do item (última coluna numérica)
  c) Extraia a QUANTIDADE (se disponível)

PASSO 4: Validação final
  → Some todos os valores extraídos
  → Compare com o "TOTAL" ou "VALOR A PAGAR" do cupom
  → Se diferença > 10%: REVISE a extração

PASSO 5: Ignore completamente
  → Linhas após "FORMA DE PAGAMENTO", "TOTAL", "TRIBUTOS"
  → Informações de CNPJ, endereço, telefone
  → Códigos NFC-e, protocolos, chaves de acesso

═══════════════════════════════════════════════════════════════════
📤 FORMATO DA RESPOSTA
═══════════════════════════════════════════════════════════════════

Retorne APENAS um JSON válido com esta estrutura:

{
  "items": [
    {
      "description": "NOME DO PRODUTO (string limpa, sem código)",
      "amount": 0.00,  // número com ponto decimal
      "quantity": 1    // número inteiro
    }
  ],
  "metadata": {
    "establishment": "Nome do estabelecimento ou null",
    "cnpj": "XX.XXX.XXX/XXXX-XX ou null",
    "date": "DD/MM/YYYY ou null",
    "time": "HH:MM:SS ou null",
    "total": 0.00,  // total do cupom
    "paymentMethod": {
      "type": "debit|credit|pix|cash|other",
      "details": "texto original da forma de pagamento"
    }
  },
  "confidence": "high|medium|low",
  "notes": "X items extracted. Sum: A + B + C = Total ✓/✗"
}

═══════════════════════════════════════════════════════════════════

Agora analise a imagem fornecida e retorne o JSON com TODOS os produtos.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: 'high'
              },
            },
          ],
        },
      ],
      max_tokens: 2500,
      temperature: 0.1, // Low temperature for consistent, factual extraction
    });

    const content = response.choices[0].message.content;
    console.log('[OpenAI] Raw response:', content);

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenAI response');
    }

    const data = JSON.parse(jsonMatch[0]);
    console.log('[OpenAI] Parsed data:', JSON.stringify(data, null, 2));

    // Validate and filter items - remove non-product entries
    const invalidKeywords = [
      'CARTEIRA DIGITAL', 'DEBITO', 'CREDITO', 'PIX', 'DINHEIRO',
      'PAGAMENTO', 'TOTAL', 'SUBTOTAL', 'VALOR A PAGAR', 'FORMA DE PAGAMENTO',
      'CNPJ', 'CPF', 'EMITENTE', 'CONSUMIDOR', 'ENDERECO',
      'DATA', 'HORA', 'NFC-e', 'SAT', 'SERIE', 'PROTOCOLO',
      'VENDEDOR', 'OPERADOR', 'CAIXA'
    ];

    const validItems = (data.items || []).filter(item => {
      const desc = item.description.toUpperCase();

      // Check if item description contains any invalid keyword
      const hasInvalidKeyword = invalidKeywords.some(keyword => desc.includes(keyword));

      // Check if description is too short (likely not a real product)
      const isTooShort = item.description.trim().length < 3;

      // Check if amount is reasonable (between 0.01 and 50000)
      const hasValidAmount = item.amount > 0.01 && item.amount < 50000;

      if (hasInvalidKeyword) {
        console.log(`[OpenAI] Filtered out invalid item: "${item.description}" (contains payment/metadata keyword)`);
        return false;
      }

      if (isTooShort) {
        console.log(`[OpenAI] Filtered out invalid item: "${item.description}" (too short)`);
        return false;
      }

      if (!hasValidAmount) {
        console.log(`[OpenAI] Filtered out invalid item: "${item.description}" (invalid amount: ${item.amount})`);
        return false;
      }

      return true;
    });

    console.log(`[OpenAI] Validation: ${data.items?.length || 0} items → ${validItems.length} valid items`);

    console.log(`[OpenAI] ✅ Successfully extracted ${validItems.length} items`);

    return {
      items: validItems,
      metadata: data.metadata || {},
      confidence: data.confidence || 'medium',
      notes: data.notes || '',
      method: 'openai',
    };
  } catch (error) {
    console.error('[OpenAI] ❌ Error during extraction:', error.message);
    console.error('[OpenAI] Error details:', {
      name: error.name,
      status: error.status,
      code: error.code,
      type: error.type
    });

    // Check for specific error types
    if (error.code === 'insufficient_quota') {
      console.error('[OpenAI] ❌ Insufficient quota! Add credits: https://platform.openai.com/settings/organization/billing');
    } else if (error.code === 'invalid_api_key') {
      console.error('[OpenAI] ❌ Invalid API key! Check your OPENAI_API_KEY environment variable');
    } else if (error.status === 429) {
      console.error('[OpenAI] ❌ Rate limit exceeded! Wait a moment and try again');
    }

    return null;
  }
}

/**
 * Smart parser - Enhanced for Brazilian receipts (NFC-e, SAT)
 * Handles multi-line product formats and various receipt structures
 */
async function parseReceiptText(text) {
  console.log('[Parser] Starting text parsing...');
  console.log('[Parser] Full text (first 500 chars):', text.substring(0, 500));

  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  const items = [];
  const metadata = {
    establishment: null,
    cnpj: null,
    date: null,
    time: null,
    total: null,
    paymentMethod: null,
  };

  // Try to detect expected number of items from receipt
  let expectedItemCount = null;
  const itemCountPatterns = [
    /(?:QTD|QTDE|QUANTIDADE)\.?\s*TOTAL\s*(?:DE\s*)?(?:ITENS)?[:\s]*(\d+)/i,
    /TOTAL\s*(?:DE\s*)?ITENS[:\s]*(\d+)/i,
    /(\d+)\s*(?:ITENS|PRODUTOS)/i
  ];

  for (const line of lines) {
    for (const pattern of itemCountPatterns) {
      const match = line.match(pattern);
      if (match) {
        expectedItemCount = parseInt(match[1]);
        console.log(`[Parser] Expected item count detected: ${expectedItemCount}`);
        break;
      }
    }
    if (expectedItemCount) break;
  }

  // Enhanced blacklist - keywords that indicate NON-product lines
  const blacklist = [
    'CARTEIRA DIGITAL', 'FORMA DE PAGAMENTO', 'FORMA PAGAMENTO',
    'CARTAO', 'DEBITO', 'CREDITO', 'PIX', 'DINHEIRO', 'TROCO',
    'CNPJ', 'CPF', 'EMITENTE', 'CONSUMIDOR', 'ENDERECO', 'TELEFONE',
    'QTD TOTAL', 'QTDE TOTAL', 'TOTAL DE ITENS', 'QUANTIDADE TOTAL',
    'VALOR A PAGAR', 'SUBTOTAL', 'DESCONTO', 'ACRESCIMO',
    'NFC-e', 'SAT', 'SERIE', 'PROTOCOLO', 'CHAVE', 'DANFE',
    'DATA', 'HORA', 'DOCUMENTO', 'TRIBUTOS', 'ARREDONDAMENTO',
    'VENDEDOR', 'OPERADOR', 'CAIXA', 'ESTABELECIMENTO',
    'CODIGO', 'DESCRICAO', 'QTDE', 'VL.UNIT', 'VL.TOTAL' // Table headers
  ];

  // Strategy: Look for product patterns across multiple lines
  // Many receipts have: Line 1 = Product name + barcode, Line 2 = Quantity + Price

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const nextLine = lines[i + 1] || '';

    console.log(`[Parser] Line ${i}: "${line}"`);

    // Skip blacklisted lines
    const lineUpper = line.toUpperCase();
    if (blacklist.some(keyword => lineUpper.includes(keyword))) {
      console.log(`[Parser] Skipping blacklisted line: "${line}"`);
      i++;
      continue;
    }

    // Skip lines that are too short or just numbers
    if (line.length < 3 || /^\d+$/.test(line)) {
      i++;
      continue;
    }

    let matched = false;

    // Pattern 1: Product name in current line, value in next line
    // Example:
    //   "7891193010012 BISN SEVEN BOYS 300G TRAD"
    //   "                     1UN   5,49        5,49"
    // Check if current line looks like a product (has letters, might have barcode)
    // AND next line has price pattern (quantity + unit + prices)
    const looksLikeProduct = /[A-Za-z]{3,}/.test(line) && !/^(TOTAL|SUBTOTAL|PAGAMENTO|FORMA)/i.test(line);

    if (looksLikeProduct && nextLine) {
      // More flexible price line detection - allows various spacing
      const nextLineHasPrice = /\d+\s*(?:UN|PC|KG|L|ML|G|PCT|un|pc|kg)\s+[\d,\.]+\s+[\d,\.]+/.test(nextLine);

      if (nextLineHasPrice) {
        console.log(`[Parser] Detected multi-line product pattern`);

        // Extract product name (remove leading numbers/barcodes)
        let description = line.replace(/^\d+\s+/, '').trim();
        description = description.replace(/^\d{13}\s+/, '').trim(); // Remove EAN-13 barcode
        description = description.replace(/^\d{12}\s+/, '').trim(); // Remove EAN-12 barcode
        description = description.replace(/^\d{8}\s+/, '').trim(); // Remove EAN-8 barcode

        // Extract value from next line (last number with 2 decimals)
        const valueMatch = nextLine.match(/([\d]+[,\.][\d]{2})\s*$/);
        if (valueMatch && description.length > 3 && /[A-Za-z]{3,}/.test(description)) {
          const amount = parseFloat(valueMatch[1].replace(',', '.'));

          if (amount > 0.01 && amount < 50000) {
            console.log(`[Parser] ✓ Found item (multi-line): "${description}" = R$ ${amount}`);
            items.push({ description, amount, quantity: 1 });
            matched = true;
            i += 2; // Skip next line (it's the price line)
            continue;
          } else {
            console.log(`[Parser] ✗ Amount out of range: ${amount}`);
          }
        } else {
          console.log(`[Parser] ✗ No valid value or description too short: "${description}"`);
        }
      }
    }

    // Pattern 2: Everything in one line - "PRODUCT NAME  1UN x 10,50  10,50"
    const singleLineMatch = line.match(/^(.+?)\s+\d+\s*(?:UN|PC|KG|L|ML|G)?\s*[xX×]\s*([\d,\.]+)\s+([\d,\.]+)\s*$/);
    if (singleLineMatch) {
      let description = singleLineMatch[1].trim();
      description = description.replace(/^\d+\s+/, '').trim(); // Remove item number
      description = description.replace(/^\d{13}\s+/, '').trim(); // Remove barcode

      const amount = parseFloat(singleLineMatch[3].replace(',', '.'));

      if (description.length > 3 && amount > 0.01 && amount < 50000) {
        console.log(`[Parser] Found item (single-line x): "${description}" = R$ ${amount}`);
        items.push({ description, amount, quantity: 1 });
        matched = true;
        i++;
        continue;
      }
    }

    // Pattern 3: Simple format - "PRODUCT NAME    49,90"
    const simpleMatch = line.match(/^(.+?)\s{2,}([\d]+[,\.][\d]{2})\s*$/);
    if (simpleMatch) {
      let description = simpleMatch[1].trim();
      description = description.replace(/^\d+\s+/, '').trim();
      description = description.replace(/^\d{13}\s+/, '').trim();

      const amount = parseFloat(simpleMatch[2].replace(',', '.'));

      // Extra validation: must have letters (not just numbers)
      if (description.length > 3 && /[A-Za-z]/.test(description) && amount > 0.01 && amount < 50000) {
        console.log(`[Parser] Found item (simple): "${description}" = R$ ${amount}`);
        items.push({ description, amount, quantity: 1 });
        matched = true;
      }
    }

    // Pattern 4: Look for product codes followed by description
    // Example: "001 PRODUTO NOME   10,50"
    const codeMatch = line.match(/^\d{1,4}\s+(.+?)\s+([\d]+[,\.][\d]{2})\s*$/);
    if (!matched && codeMatch) {
      const description = codeMatch[1].trim();
      const amount = parseFloat(codeMatch[2].replace(',', '.'));

      if (description.length > 3 && /[A-Za-z]/.test(description) && amount > 0.01 && amount < 50000) {
        console.log(`[Parser] Found item (with code): "${description}" = R$ ${amount}`);
        items.push({ description, amount, quantity: 1 });
        matched = true;
      }
    }

    i++;
  }

  // Remove duplicates (same description and amount)
  const uniqueItems = [];
  const seen = new Set();

  for (const item of items) {
    const key = `${item.description.toLowerCase()}_${item.amount.toFixed(2)}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    } else {
      console.log(`[Parser] Removed duplicate: "${item.description}" = R$ ${item.amount}`);
    }
  }

  console.log(`[Parser] Total items found: ${uniqueItems.length} (${items.length - uniqueItems.length} duplicates removed)`);

  // Replace items with unique items
  items.length = 0;
  items.push(...uniqueItems);

  // Extract total - look for "Valor a Pagar", "TOTAL", etc.
  const totalPatterns = [
    /(?:VALOR\s+A\s+PAGAR|TOTAL|VL\.?\s*TOTAL)[:\s]*R?\$?\s*(\d+[,\.]\d{2})/i,
    /TOTAL[:\s]+(\d+[,\.]\d{2})/i,
  ];

  for (const line of lines) {
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match) {
        metadata.total = parseFloat(match[1].replace(',', '.'));
        break;
      }
    }
    if (metadata.total) break;
  }

  // Extract CNPJ (with or without formatting)
  const cnpjRegex = /CNPJ[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i;
  for (const line of lines) {
    const match = line.match(cnpjRegex);
    if (match) {
      metadata.cnpj = match[1];
      break;
    }
  }

  // Extract date (DD/MM/YYYY or DD/MM/YY)
  const dateRegex = /(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})/;
  for (const line of lines) {
    // Skip if line contains time-related keywords without date
    if (line.match(/HORA|HORARIO/i) && !line.match(/DATA/i)) continue;

    const match = line.match(dateRegex);
    if (match) {
      let dateStr = match[1].replace(/-/g, '/');
      // Convert YY to YYYY if needed
      const parts = dateStr.split('/');
      if (parts[2].length === 2) {
        const year = parseInt(parts[2]);
        parts[2] = year > 50 ? `19${year}` : `20${year}`;
        dateStr = parts.join('/');
      }
      metadata.date = dateStr;
      break;
    }
  }

  // Extract payment method
  const paymentPatterns = [
    { regex: /CARTAO\s+(?:DE\s+)?CREDITO|CREDITO/i, type: 'credit' },
    { regex: /CARTAO\s+(?:DE\s+)?DEBITO|DEBITO/i, type: 'debit' },
    { regex: /CARTEIRA\s+DIGITAL/i, type: 'other' },
    { regex: /\bPIX\b/i, type: 'pix' },
    { regex: /DINHEIRO/i, type: 'cash' },
  ];

  for (const line of lines) {
    for (const { regex, type } of paymentPatterns) {
      if (regex.test(line)) {
        metadata.paymentMethod = {
          type,
          details: line.trim(),
        };
        break;
      }
    }
    if (metadata.paymentMethod) break;
  }

  // Validation: Compare sum of items with receipt total
  const itemsSum = items.reduce((sum, item) => sum + item.amount, 0);
  console.log(`\n[Parser] ═══════════════════════════════════════`);
  console.log(`[Parser] 📊 EXTRACTION SUMMARY`);
  console.log(`[Parser] ═══════════════════════════════════════`);
  console.log(`[Parser] Items extracted: ${items.length}${expectedItemCount ? ` (expected: ${expectedItemCount})` : ''}`);
  console.log(`[Parser] Sum of items: R$ ${itemsSum.toFixed(2)}`);
  console.log(`[Parser] Receipt total: R$ ${metadata.total ? metadata.total.toFixed(2) : 'N/A'}`);

  // Item count validation
  if (expectedItemCount) {
    if (items.length === expectedItemCount) {
      console.log(`[Parser] ✅ Item count: MATCH (${items.length}/${expectedItemCount})`);
    } else if (items.length < expectedItemCount) {
      console.log(`[Parser] ⚠️  Item count: Missing ${expectedItemCount - items.length} item(s)`);
    } else {
      console.log(`[Parser] ⚠️  Item count: ${items.length - expectedItemCount} extra item(s) detected`);
    }
  }

  // Total amount validation
  if (metadata.total && items.length > 0) {
    const difference = Math.abs(itemsSum - metadata.total);
    const percentDiff = (difference / metadata.total) * 100;

    if (percentDiff < 1) {
      console.log(`[Parser] ✅ Amount validation: PERFECT MATCH (diff: R$ ${difference.toFixed(2)})`);
    } else if (percentDiff < 10) {
      console.log(`[Parser] ⚠️  Amount validation: Close match (diff: ${percentDiff.toFixed(1)}%)`);
    } else {
      console.log(`[Parser] ❌ Amount validation: MISMATCH (diff: ${percentDiff.toFixed(1)}%)`);
      console.log(`[Parser] ⚠️  Some items may be missing or incorrectly extracted`);
    }
  } else if (items.length === 0) {
    console.log(`[Parser] ❌ No items extracted - parser failed`);
  }

  console.log(`[Parser] ═══════════════════════════════════════\n`);

  return {
    items,
    metadata,
    confidence: items.length > 0 ? 'medium' : 'low',
    method: 'parser',
    validation: {
      itemsSum: parseFloat(itemsSum.toFixed(2)),
      receiptTotal: metadata.total,
      difference: metadata.total ? parseFloat(Math.abs(itemsSum - metadata.total).toFixed(2)) : null,
      percentDiff: metadata.total ? parseFloat(((Math.abs(itemsSum - metadata.total) / metadata.total) * 100).toFixed(2)) : null
    }
  };
}

/**
 * Main function - orchestrates all OCR methods
 * PRIORITY: GPT-4o Vision FIRST (direct), Tesseract as fallback only
 */
async function extractReceiptData(imageBuffer) {
  console.log('\n🔍 Starting Advanced OCR extraction...\n');
  console.log('📋 Extraction strategy: GPT-4o Vision (primary) → Tesseract + Parser (fallback)\n');

  // STEP 1: Try GPT-4o Vision FIRST (if API key is configured)
  console.log('[1/2] 🤖 Attempting GPT-4o Vision extraction...');
  const openaiResult = await extractWithOpenAI(imageBuffer);

  if (openaiResult && openaiResult.items && openaiResult.items.length > 0) {
    console.log(`\n✅ SUCCESS: GPT-4o Vision extracted ${openaiResult.items.length} items`);
    console.log('✓ Using GPT-4o Vision result (highest quality - no Tesseract needed)');
    console.log(`✅ Extraction complete: ${openaiResult.items.length} items found`);
    console.log(`📊 Method: ${openaiResult.method}, Confidence: ${openaiResult.confidence}\n`);
    return openaiResult;
  }

  // STEP 2: Fallback to Tesseract + Parser (only if OpenAI failed or unavailable)
  console.log('\n⚠️  GPT-4o Vision unavailable or failed, falling back to Tesseract + Parser...\n');

  console.log('[2/2] 📝 Preprocessing image for Tesseract...');
  const processedImage = await preprocessImage(imageBuffer);

  console.log('[2/2] 🔍 Running Tesseract OCR...');
  const tesseractResult = await extractWithTesseract(processedImage);

  console.log('[2/2] 🧩 Parsing text with enhanced parser...');
  const parserResult = await parseReceiptText(tesseractResult.text);

  if (parserResult.items.length > 0) {
    console.log(`\n✅ Tesseract + Parser extracted ${parserResult.items.length} items`);
    console.log(`✅ Extraction complete: ${parserResult.items.length} items found`);
    console.log(`📊 Method: ${parserResult.method}, Confidence: ${parserResult.confidence}\n`);
    return parserResult;
  }

  // Last resort: return raw text
  console.log('\n❌ All extraction methods failed - returning raw Tesseract text\n');
  return {
    items: [],
    metadata: {},
    rawText: tesseractResult.text,
    confidence: 'low',
    method: 'tesseract-raw',
  };
}

module.exports = {
  extractReceiptData,
  preprocessImage,
  extractWithTesseract,
  extractWithOpenAI,
  parseReceiptText,
};
