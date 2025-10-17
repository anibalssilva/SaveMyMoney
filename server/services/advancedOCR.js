/**
 * ADVANCED OCR SERVICE
 * Multi-method OCR with AI-powered validation
 * Combines: Tesseract.js + OpenAI GPT-4 Vision + Smart Parser
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
 * Extract COMPLETE receipt data including metadata using OpenAI GPT-4 Vision
 */
async function extractWithOpenAI(imageBuffer) {
  initializeOpenAI();

  if (!openai) {
    console.log('[OpenAI] API key not configured, skipping...');
    return null;
  }

  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // GPT-4 with vision
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Você é um especialista em OCR de cupons fiscais brasileiros (NFC-e, SAT, DANFE).

🎯 TAREFA: Extrair CADA PRODUTO INDIVIDUAL do cupom com seu respectivo VALOR UNITÁRIO/TOTAL.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ REGRAS ABSOLUTAS - LEIA COM ATENÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ **IDENTIFICAÇÃO DE PRODUTOS**

   Os produtos em cupons fiscais brasileiros aparecem em uma destas estruturas:

   Estrutura A (código + descrição em linha separada do valor):
   ┌─────────────────────────────────────────────────┐
   │ 7891193010012 BISN SEVEN BOYS 300G TRAD        │
   │                      1UN   5,49        5,49     │
   └─────────────────────────────────────────────────┘

   Estrutura B (descrição + valor na mesma linha):
   ┌─────────────────────────────────────────────────┐
   │ COPO QUENCHER 420ML      1 PC X 49,90   49,90  │
   └─────────────────────────────────────────────────┘

   Estrutura C (descrição em linha, quantidade/valor abaixo):
   ┌─────────────────────────────────────────────────┐
   │ FRAL HUGGIES MAXIMA PROT C56 XG                │
   │ 1UN  73,47  73,47                              │
   └─────────────────────────────────────────────────┘

2️⃣ **O QUE EXTRAIR**
   ✅ Nome do produto (sem código de barras)
   ✅ Valor FINAL do item (coluna VL.TOTAL ou último valor)
   ✅ Quantidade (se disponível)

3️⃣ **O QUE IGNORAR COMPLETAMENTE**
   ❌ Linhas que contenham: "CARTEIRA DIGITAL", "DEBITO", "CREDITO", "PIX", "DINHEIRO"
   ❌ Linhas que contenham: "PAGAMENTO", "TOTAL", "SUBTOTAL", "VALOR A PAGAR"
   ❌ Linhas que contenham: "CNPJ", "CPF", "EMITENTE", "CONSUMIDOR"
   ❌ Linhas que contenham: "DATA", "HORA", "NFC-e", "SAT", "SERIE"
   ❌ Números de código de barras isolados (13 dígitos sem descrição)

4️⃣ **VALIDAÇÃO**
   ⚠️ Se você extraiu "CARTEIRA DIGITAL" como produto → ESTÁ ERRADO!
   ⚠️ Se você extraiu "FORMA PAGAMENTO" como produto → ESTÁ ERRADO!
   ⚠️ Se a soma dos itens não bate com o total do cupom → REVISE!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 EXEMPLO COMPLETO DE CUPOM REAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMERCIAL ZARAGOZA IMP EXP LTDA
CNPJ 05.868.574/0020-62
16/10/25 14:02:02

CODIGO DESCRICAO                    QTDE  UN  VL.UNIT  VL.TOTAL

7891193010012 BISN SEVEN BOYS 300G TRAD
                                     1UN   5,49        5,49

7896007552825 FRAL HUGGIES MAXIMA PROT C56 XG
                                     1UN  73,47       73,47

Qtd. Total de Itens                                       2
Valor a Pagar R$                                      78,96
FORMA PAGAMENTO                              VALOR PAGO
CARTEIRA DIGITAL                                     78,96

NFC-e n. 000002083 Serie 406 16/10/2025

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ JSON CORRETO (2 PRODUTOS, NÃO 1!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "items": [
    {
      "description": "BISN SEVEN BOYS 300G TRAD",
      "amount": 5.49,
      "quantity": 1
    },
    {
      "description": "FRAL HUGGIES MAXIMA PROT C56 XG",
      "amount": 73.47,
      "quantity": 1
    }
  ],
  "metadata": {
    "establishment": "COMERCIAL ZARAGOZA IMP EXP LTDA",
    "cnpj": "05.868.574/0020-62",
    "date": "16/10/2025",
    "time": "14:02:02",
    "total": 78.96,
    "paymentMethod": {
      "type": "other",
      "details": "CARTEIRA DIGITAL"
    }
  },
  "confidence": "high",
  "notes": "2 itens extraídos, total validado (5.49 + 73.47 = 78.96)"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ JSON ERRADO (O QUE NÃO FAZER!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "items": [
    {"description": "CARTEIRA DIGITAL", "amount": 78.96}  ← ERRADO!
  ]
}

Por quê é errado? "CARTEIRA DIGITAL" é forma de PAGAMENTO, NÃO é um produto!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 PROCESSO DE EXTRAÇÃO:

1. Procure a seção de produtos (geralmente após "CODIGO DESCRICAO" ou similar)
2. Identifique cada linha que contém nome de produto
3. Encontre o valor correspondente (pode estar na linha seguinte)
4. Ignore completamente seções de pagamento, totais, e informações fiscais
5. Valide: soma dos items = total do cupom (aprox.)

📤 FORMATO DA RESPOSTA:
- Retorne APENAS o JSON
- Sem texto adicional antes ou depois
- Use números com ponto decimal (não vírgula)
- Campo "notes" deve conter contagem de itens e validação de soma`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
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

    return {
      items: validItems,
      metadata: data.metadata || {},
      confidence: data.confidence || 'medium',
      notes: data.notes || '',
      method: 'openai',
    };
  } catch (error) {
    console.error('[OpenAI] Error:', error);
    return null;
  }
}

/**
 * Smart parser - combines Tesseract + OpenAI results
 */
async function parseReceiptText(text) {
  const lines = text.split('\n').filter(line => line.trim());

  const items = [];
  const metadata = {
    establishment: null,
    cnpj: null,
    date: null,
    time: null,
    total: null,
    paymentMethod: null,
  };

  // Blacklist of keywords that should NOT be extracted as products
  const blacklist = [
    'CNPJ', 'CPF', 'EMITENTE', 'CONSUMIDOR', 'ENDERECO', 'TELEFONE', 'FONE',
    'TOTAL', 'SUBTOTAL', 'VALOR A PAGAR', 'FORMA PAGAMENTO', 'CARTAO', 'DEBITO', 'CREDITO',
    'PIX', 'DINHEIRO', 'TROCO', 'NFC-e', 'SAT', 'SERIE', 'PROTOCOLO', 'CHAVE DE ACESSO',
    'DATA', 'HORA', 'DOCUMENTO', 'AUXILIAR', 'TRIBUTOS', 'ARREDONDAMENTO',
    'VENDEDOR', 'OPERADOR', 'CAIXA', 'LOJA', 'ESTABELECIMENTO'
  ];

  // Extract items - more precise regex that looks for product patterns
  // Pattern: Description followed by quantity indicator (UN, PC, KG) and value
  const itemPatterns = [
    // Pattern 1: "PRODUCT NAME \n 1UN 10,50 10,50"
    /^([A-Z0-9][A-Z0-9\s\/\-\.]+)\s+(\d+(?:UN|PC|KG|L|ML))\s+(\d+[,\.]\d{2})\s+(\d+[,\.]\d{2})$/i,
    // Pattern 2: "PRODUCT NAME 1UN × 10,50 = 10,50"
    /^([A-Z0-9][A-Z0-9\s\/\-\.]+)\s+(\d+)(?:UN|PC|KG|L|ML)?\s*[×xX]\s*(\d+[,\.]\d{2})\s*=?\s*(\d+[,\.]\d{2})$/i,
    // Pattern 3: Simple "PRODUCT NAME 10,50"
    /^([A-Z][A-Z0-9\s\/\-\.]{5,})\s+(\d+[,\.]\d{2})$/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip if line contains blacklisted keywords
    if (blacklist.some(keyword => line.toUpperCase().includes(keyword))) {
      continue;
    }

    // Skip lines that are too short or too long
    if (line.length < 5 || line.length > 100) continue;

    // Try each pattern
    for (const pattern of itemPatterns) {
      const match = line.match(pattern);
      if (match) {
        const description = match[1].trim();
        const amount = parseFloat((match[match.length - 1] || match[2]).replace(',', '.'));

        // Validate amount is reasonable (between 0.01 and 10000)
        if (amount > 0.01 && amount < 10000) {
          items.push({
            description,
            amount,
            quantity: 1,
          });
        }
        break;
      }
    }
  }

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

  return { items, metadata, confidence: items.length > 0 ? 'medium' : 'low', method: 'parser' };
}

/**
 * Main function - orchestrates all OCR methods
 */
async function extractReceiptData(imageBuffer) {
  console.log('\n🔍 Starting Advanced OCR extraction...\n');

  // Step 1: Preprocess image
  console.log('[1/4] Preprocessing image...');
  const processedImage = await preprocessImage(imageBuffer);

  // Step 2: Extract with Tesseract
  console.log('[2/4] Running Tesseract OCR...');
  const tesseractResult = await extractWithTesseract(processedImage);

  // Step 3: Extract with OpenAI (if available)
  console.log('[3/4] Running OpenAI Vision...');
  const openaiResult = await extractWithOpenAI(imageBuffer);

  // Step 4: Parse Tesseract text as fallback
  console.log('[4/4] Parsing text with smart parser...');
  const parserResult = await parseReceiptText(tesseractResult.text);

  // Combine results (prefer OpenAI > Parser > Tesseract)
  console.log('\n✅ Combining results...\n');

  let finalResult = parserResult;

  if (openaiResult && openaiResult.items.length > 0) {
    console.log('✓ Using OpenAI result (highest quality)');
    finalResult = openaiResult;
  } else if (parserResult.items.length > 0) {
    console.log('✓ Using parser result (fallback)');
  } else {
    console.log('✓ Using raw Tesseract text (last resort)');
    finalResult = {
      items: [],
      metadata: {},
      rawText: tesseractResult.text,
      confidence: 'low',
      method: 'tesseract-raw',
    };
  }

  return finalResult;
}

module.exports = {
  extractReceiptData,
  preprocessImage,
  extractWithTesseract,
  extractWithOpenAI,
  parseReceiptText,
};
