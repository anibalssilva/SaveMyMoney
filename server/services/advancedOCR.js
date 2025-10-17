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
 * Extract and validate using OpenAI GPT-4 Vision
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
              text: `Você é um especialista em extração de dados de cupons fiscais brasileiros.

INSTRUÇÕES:
1. Analise a imagem do cupom fiscal
2. Extraia APENAS os produtos/serviços comprados com seus valores
3. Ignore linhas de total, subtotal, impostos, troco, pagamento, CPF, CNPJ, etc.
4. Para cada item, extraia: descrição e valor

FORMATO DE RESPOSTA (JSON):
{
  "items": [
    {"description": "Nome do produto exato", "amount": 12.50},
    {"description": "Outro produto", "amount": 5.99}
  ],
  "confidence": "high|medium|low",
  "notes": "Observações sobre a qualidade da imagem ou dificuldades"
}

IMPORTANTE:
- Use o valor UNITÁRIO se houver quantidade
- Valores em formato brasileiro: 12,50 ou 12.50
- Descrições sem códigos ou números de item
- Se a imagem estiver ilegível, retorne confidence: "low" e items vazio`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const content = response.choices[0].message.content;
    console.log('[OpenAI] Raw response:', content);

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log('[OpenAI] Extracted items:', result.items?.length || 0);
    console.log('[OpenAI] Confidence:', result.confidence);

    return {
      items: result.items || [],
      confidence: result.confidence,
      notes: result.notes,
      method: 'openai-vision',
      rawResponse: content
    };
  } catch (error) {
    console.error('[OpenAI] Error:', error.message);
    return { items: [], confidence: 'error', method: 'openai-vision', error: error.message };
  }
}

/**
 * Smart parser for Brazilian receipts
 * Improved patterns based on real receipt analysis
 */
function smartParseBrazilianReceipt(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const items = [];

  // Keywords to ignore (not products)
  const ignoreKeywords = [
    'total', 'subtotal', 'desconto', 'troco', 'pago', 'dinheiro', 'cartao',
    'debito', 'credito', 'cpf', 'cnpj', 'data', 'hora', 'cupom', 'fiscal',
    'valor', 'quantidade', 'qtd', 'cod', 'codigo', 'item', 'seq', 'icms',
    'pis', 'cofins', 'issqn', 'nota', 'danfe', 'nfe', 'saldo', 'acrescimo',
    'sat', 'migre', 'nfc', 'chave', 'token', 'vendedor', 'operador', 'caixa',
    'endereco', 'telefone', 'cnae', 'ie', 'im', 'extrato', 'cupom fiscal',
    'informacoes', 'consumidor', 'aproximado', 'tributos'
  ];

  // Enhanced patterns for Brazilian receipts
  const patterns = [
    // Pattern 1: PRODUTO (spaces) VALOR
    // Ex: "COPO QUENCHER 420ML          49,90"
    /^(.+?)\s{2,}([\d]+[,.][\d]{2})$/,

    // Pattern 2: PRODUTO + PC/UN/KG + QTD + x + PREÇO + TOTAL
    // Ex: "ARROZ 1KG  UN  1,000 x 12,99  12,99"
    /^(.+?)\s+(?:PC|UN|KG|CX|LT|ML|G|PCT)\s+[\d,]+\s*[xX*]\s*[\d,]+\s+([\d,]+)$/,

    // Pattern 3: QTD + PRODUTO + VALOR
    // Ex: "1 PC X 49,90     49,90"
    /^(?:\d+\s*)?(.+?)\s+[xX*]?\s*([\d]+[,.][\d]{2})\s*$/,

    // Pattern 4: PRODUTO + R$ + VALOR
    // Ex: "CAFE PILAO R$ 15,99"
    /^(.+?)\s+R\$?\s*([\d]+[,.][\d]{2})$/,

    // Pattern 5: Código + PRODUTO + VALOR
    // Ex: "5056  COPO QUENCHER 420ML  49,90"
    /^\d+\s+(.+?)\s+([\d]+[,.][\d]{2})$/,

    // Pattern 6: PRODUTO with thousands separator
    // Ex: "NOTEBOOK DELL  1.299,99"
    /^(.+?)\s+([\d]{1,3}\.[\d]{3}[,][\d]{2})$/,
  ];

  for (const line of lines) {
    // Skip empty or very short lines
    if (line.length < 3) continue;

    // Skip lines with ignore keywords
    const lowerLine = line.toLowerCase();
    if (ignoreKeywords.some(keyword => lowerLine.includes(keyword))) {
      continue;
    }

    // Try each pattern
    for (const pattern of patterns) {
      const match = line.match(pattern);

      if (match) {
        let description = match[1].trim();
        let amountStr = match[2].trim();

        // Clean description
        description = description
          .replace(/^\d+\s*-?\s*/, '') // Remove leading numbers
          .replace(/\s+/g, ' ')        // Normalize spaces
          .replace(/^(PC|UN|KG|CX|LT|ML|G|PCT)\s+/i, '') // Remove unit prefix
          .trim();

        // Validate description
        if (description.length < 3 || description.length > 100) continue;
        if (/^\d+$/.test(description)) continue; // Only numbers
        if (/^[^a-zA-Z]+$/.test(description)) continue; // No letters

        // Parse amount
        amountStr = amountStr
          .replace(/\./g, '')  // Remove thousands separator
          .replace(',', '.');  // Replace comma with dot

        const amount = parseFloat(amountStr);

        // Validate amount
        if (isNaN(amount) || amount <= 0 || amount > 100000) continue;

        // Check for duplicates
        const isDuplicate = items.some(
          item => item.description === description && Math.abs(item.amount - amount) < 0.01
        );

        if (!isDuplicate) {
          items.push({
            description,
            amount,
            originalLine: line,
            pattern: patterns.indexOf(pattern) + 1
          });
          break; // Stop at first matching pattern
        }
      }
    }
  }

  console.log(`[SmartParser] Extracted ${items.length} items`);
  return items;
}

/**
 * Main OCR function - Hybrid approach
 */
async function extractReceiptData(imageBuffer) {
  console.log('=== Starting Advanced OCR Extraction ===');

  try {
    // Step 1: Preprocess image
    console.log('Step 1: Preprocessing image...');
    const processedBuffer = await preprocessImage(imageBuffer);

    // Step 2: Try OpenAI Vision first (if available)
    let openaiResult = null;
    if (process.env.OPENAI_API_KEY) {
      console.log('Step 2: Attempting OpenAI GPT-4 Vision...');
      openaiResult = await extractWithOpenAI(processedBuffer);

      // If OpenAI has high confidence, use it directly
      if (openaiResult && openaiResult.confidence === 'high' && openaiResult.items.length > 0) {
        console.log('✅ OpenAI extraction successful with high confidence');
        return {
          items: openaiResult.items,
          method: 'openai-vision',
          confidence: 'high',
          details: openaiResult
        };
      }
    }

    // Step 3: Fallback to Tesseract
    console.log('Step 3: Running Tesseract OCR...');
    const tesseractResult = await extractWithTesseract(processedBuffer);

    // Step 4: Parse with smart parser
    console.log('Step 4: Parsing with smart Brazilian receipt parser...');
    const parsedItems = smartParseBrazilianReceipt(tesseractResult.text);

    // Step 5: If OpenAI gave medium confidence, merge results
    let finalItems = parsedItems;
    let finalMethod = 'tesseract+parser';
    let finalConfidence = tesseractResult.confidence;

    if (openaiResult && openaiResult.items.length > 0) {
      console.log('Step 5: Merging OpenAI and Tesseract results...');

      // Use OpenAI items as primary, Tesseract as fallback
      if (openaiResult.confidence === 'medium' && parsedItems.length > 0) {
        finalItems = [...openaiResult.items, ...parsedItems];
        finalMethod = 'hybrid';
      } else if (openaiResult.items.length > parsedItems.length) {
        finalItems = openaiResult.items;
        finalMethod = 'openai-vision';
        finalConfidence = 'medium';
      }
    }

    // Remove duplicates from merged results
    const uniqueItems = [];
    const seen = new Set();

    for (const item of finalItems) {
      const key = `${item.description.toLowerCase()}_${item.amount.toFixed(2)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push(item);
      }
    }

    console.log(`✅ Final extraction: ${uniqueItems.length} items (method: ${finalMethod})`);

    return {
      items: uniqueItems,
      method: finalMethod,
      confidence: finalConfidence,
      details: {
        tesseract: {
          confidence: tesseractResult.confidence,
          textLength: tesseractResult.text.length,
          rawText: tesseractResult.text.substring(0, 500) // First 500 chars for debugging
        },
        openai: openaiResult ? {
          confidence: openaiResult.confidence,
          itemsCount: openaiResult.items.length,
          notes: openaiResult.notes
        } : null
      }
    };

  } catch (error) {
    console.error('❌ Advanced OCR error:', error);
    throw error;
  }
}

module.exports = {
  extractReceiptData,
  preprocessImage,
  extractWithTesseract,
  extractWithOpenAI,
  smartParseBrazilianReceipt
};
