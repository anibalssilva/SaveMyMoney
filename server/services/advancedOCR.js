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
              text: `Você é um especialista em extração de dados estruturados de cupons fiscais brasileiros (SAT, NFC-e ou DANFE).

Sua tarefa é ANALISAR a imagem de um cupom fiscal e retornar um JSON completo e padronizado, conforme o formato abaixo.

⚙️ REGRAS DE EXTRAÇÃO:
1. Extraia **todos os produtos** com nome completo, quantidade e valor unitário.
2. Inclua também o **valor total pago**, o **CNPJ** do estabelecimento, **nome da loja**, **data e hora** da compra, e **forma de pagamento**.
3. Identifique automaticamente o tipo de pagamento com base em palavras como:
   - "CREDITO", "CARTÃO DE CRÉDITO" → "type": "credit"
   - "DÉBITO", "CARTÃO DE DÉBITO" → "type": "debit"
   - "DINHEIRO" → "type": "cash"
   - "PIX" → "type": "pix"
   - "CARTEIRA DIGITAL", "VALE", "OUTRO" → "type": "other"
4. Use **valores numéricos com duas casas decimais**.
5. Se um dado não estiver presente, retorne null.
6. Converta a data para o formato DD/MM/YYYY.
7. Todos os valores devem estar em reais (R$), sem o símbolo.

---

📦 **FORMATO JSON DE SAÍDA:**

{
  "items": [
    {"description": "Nome do produto exato", "amount": 12.50, "quantity": 1}
  ],
  "metadata": {
    "establishment": "Nome do estabelecimento",
    "cnpj": "00.000.000/0000-00",
    "date": "DD/MM/YYYY",
    "time": "HH:MM:SS",
    "total": 0.00,
    "paymentMethod": {
      "type": "credit|debit|cash|pix|other",
      "details": "Texto original da forma de pagamento"
    }
  },
  "confidence": "high|medium|low",
  "notes": "Observações relevantes, como vendedor, série, ou número do SAT/NFC-e."
}

---

🧩 **INSTRUÇÕES ADICIONAIS:**
- Ignore seções como "TOTAL DE TRIBUTOS", "ARREDONDAMENTO", "TROCO", ou "DOCUMENTO AUXILIAR".
- O foco é apenas nas informações de **itens e pagamento**.
- Se houver múltiplas formas de pagamento, liste a principal ou divida proporcionalmente.
- Identifique **o vendedor** se constar no cupom.
- Mantenha todos os textos em português.

---

📸 Após o upload da imagem do cupom fiscal, retorne SOMENTE o JSON final, sem explicações adicionais.`
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

  // Extract items (simple regex-based parsing)
  const itemRegex = /(.+?)\s+(\d+[,\.]\d{2})/;
  for (const line of lines) {
    const match = line.match(itemRegex);
    if (match) {
      items.push({
        description: match[1].trim(),
        amount: parseFloat(match[2].replace(',', '.')),
        quantity: 1,
      });
    }
  }

  // Extract total
  const totalRegex = /TOTAL[:\s]+(R?\$?\s*)?(\d+[,\.]\d{2})/i;
  for (const line of lines) {
    const match = line.match(totalRegex);
    if (match) {
      metadata.total = parseFloat(match[2].replace(',', '.'));
      break;
    }
  }

  // Extract CNPJ
  const cnpjRegex = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/;
  for (const line of lines) {
    const match = line.match(cnpjRegex);
    if (match) {
      metadata.cnpj = match[1];
      break;
    }
  }

  // Extract date
  const dateRegex = /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/;
  for (const line of lines) {
    const match = line.match(dateRegex);
    if (match) {
      metadata.date = match[1].replace(/-/g, '/');
      break;
    }
  }

  return { items, metadata, confidence: 'medium', method: 'parser' };
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
