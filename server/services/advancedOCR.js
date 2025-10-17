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
              text: `Você é um especialista em extração de dados de cupons fiscais brasileiros (NFC-e, SAT, DANFE).

🎯 SUA TAREFA: Analise a imagem do cupom fiscal e extraia SOMENTE os produtos comprados com seus valores.

⚠️ REGRAS CRÍTICAS:
1. **PRODUTOS**: Extraia APENAS itens que sejam PRODUTOS COMPRADOS (com descrição + valor)
   - ✅ CORRETO: "BISN SEVEN BOYS 300G" → R$ 5.49
   - ✅ CORRETO: "FRAL HUGGIES MAXIMA PROT C56" → R$ 73.47
   - ❌ ERRADO: NÃO extraia "CNPJ", "Valor a Pagar", "Data", "NFC-e", etc como produtos!

2. **VALORES**: Use o valor TOTAL do item (quantidade × valor unitário)
   - Se mostra "1UN × 5,49 = 5,49" → use 5.49
   - Se mostra "2UN × 10,00 = 20,00" → use 20.00

3. **FORMATO DE NÚMEROS**:
   - Converta vírgula para ponto: "73,47" → 73.47
   - Remova "R$" e espaços: "R$ 78,96" → 78.96

4. **FORMA DE PAGAMENTO**:
   - "CARTAO DE CREDITO" ou "CREDITO" → "credit"
   - "CARTAO DE DEBITO" ou "DEBITO" → "debit"
   - "CARTEIRA DIGITAL" → "other"
   - "PIX" → "pix"
   - "DINHEIRO" → "cash"

5. **DATA**: Formato DD/MM/YYYY (ex: "16/10/2025")

---

📋 EXEMPLO DE CUPOM REAL:

CODIGO DESCRICAO                    QTDE  UN  VL.UNIT  VL.TOTAL
7891193010012 BISN SEVEN BOYS 300G TRAD
                                     1UN   5,49        5,49
7896007552825 FRAL HUGGIES MAXIMA PROT C56 XG
                                     1UN  73,47       73,47

Qtd. Total de Itens                                       2
Valor a Pagar R$                                      78,96
FORMA PAGAMENTO                              VALOR PAGO
CARTEIRA DIGITAL                                     78,96

---

✅ JSON CORRETO PARA ESTE EXEMPLO:

{
  "items": [
    {"description": "BISN SEVEN BOYS 300G TRAD", "amount": 5.49, "quantity": 1},
    {"description": "FRAL HUGGIES MAXIMA PROT C56 XG", "amount": 73.47, "quantity": 1}
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
  "notes": "NFC-e n. 000002083 Série 406"
}

---

🚫 O QUE **NÃO** EXTRAIR COMO PRODUTO:
- CNPJ do estabelecimento
- Endereço da loja
- Data/hora
- "Valor a Pagar"
- "Forma de Pagamento"
- "Total de Itens"
- Números de série, protocolo, SAT
- QR Code, códigos de barras
- Informações fiscais

📸 Retorne APENAS o JSON, sem texto adicional.`
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

    return {
      items: data.items || [],
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
