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
          content: `Você é um extrator PRECISO de cupons fiscais brasileiros (NFC-e/SAT).

REGRAS CRÍTICAS:

1. EXTRAÇÃO DE ITENS:
   - Extraia TODOS os produtos (description, quantity, unit_price, total)
   - Ignore: pagamentos, totais/subtotais, tributos, chaves, protocolos
   - Una linhas quebradas (código/descrição podem estar em linhas separadas)
   - Quantidade pode ser decimal (ex: 0.418 KG)

2. LEITURA DE VALORES (CRÍTICO):
   - O valor TOTAL do item é o ÚLTIMO número monetário da linha
   - Formato brasileiro: use vírgula decimal → converta para ponto (29,90 → 29.90)
   - NÃO confunda preço unitário com total
   - Exemplo: "1 UN x 29,90 F 29,90" → total = 29.90
   - Exemplo: "3 UN x 2,99 F 8,97" → total = 8.97 (NÃO 2.99)
   - Se houver 2 valores na linha, o ÚLTIMO é o total

3. VALIDAÇÃO INTERNA:
   - Verifique: quantity × unit_price = total (±0.05 tolerância)
   - Se não bater, use o valor mais à direita como total
   - Conte quantos itens você extraiu
   - Compare com "QTD. TOTAL DE ITENS" do cupom (se presente)

4. NORMALIZAÇÃO:
   - pt-BR → EN: 12,90 → 12.90 | 1.234,56 → 1234.56
   - Remova espaços extras das descrições
   - NÃO invente dados: se faltar, use null

5. SAÍDA JSON:
{
  "items": [
    {
      "description": "NOME PRODUTO",
      "quantity": 1,
      "unit_price": 29.90,
      "total": 29.90
    }
  ],
  "metadata": {
    "date": "DD/MM/YYYY" ou null,
    "total": 445.97
  },
  "checks": {
    "sum_items": 445.97,
    "declared_total": 445.97,
    "delta": 0.00,
    "item_count": 34
  }
}

RESPONDA APENAS COM O JSON. SEM EXPLICAÇÕES.`
        },
        {
          role: 'user',
          content: [
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
      max_tokens: 8000, // Increased to handle large receipts (50+ items)
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

    // Normalize items: GPT-4o returns "total" but we need "amount"
    const normalizedItems = (data.items || []).map(item => ({
      description: item.description,
      amount: item.total || item.amount, // GPT-4o uses "total", fallback to "amount"
      quantity: item.quantity || 1,
      unit_price: item.unit_price
    }));

    const validItems = normalizedItems.filter(item => {
      const desc = item.description.toUpperCase();

      // Check if item description contains any invalid keyword
      const hasInvalidKeyword = invalidKeywords.some(keyword => desc.includes(keyword));

      // Check if description is too short (likely not a real product)
      const isTooShort = item.description.trim().length < 3;

      // Check if amount is reasonable (between 0.01 and 50000)
      const hasValidAmount = item.amount && item.amount > 0.01 && item.amount < 50000;

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
 * Main function - HYBRID METHOD
 * Combines GPT-4o Vision + Tesseract Parser for maximum accuracy
 *
 * Strategy:
 * 1. Run GPT-4o Vision AND Tesseract+Parser in parallel
 * 2. Extract expected item count from Tesseract text
 * 3. Validate GPT-4o result against expected count
 * 4. If GPT-4o is incomplete, merge with Tesseract items
 * 5. Return the most complete result
 */
async function extractReceiptData(imageBuffer) {
  console.log('\n🔍 Starting HYBRID OCR extraction...\n');
  console.log('📋 Strategy: GPT-4o Vision + Tesseract Parser (parallel) → Intelligent Merge\n');

  // STEP 1: Preprocess image for Tesseract
  console.log('[1/3] 📝 Preprocessing image...');
  const processedImage = await preprocessImage(imageBuffer);

  // STEP 2: Run GPT-4o Vision AND Tesseract in PARALLEL for speed
  console.log('[2/3] 🤖 Running GPT-4o Vision + Tesseract in parallel...\n');

  const [openaiResult, tesseractResult] = await Promise.all([
    extractWithOpenAI(imageBuffer),
    extractWithTesseract(processedImage)
  ]);

  console.log('\n[3/3] 🧠 Analyzing results and applying intelligent merge...\n');

  // STEP 3: Parse Tesseract text to get parser results and expected item count
  const parserResult = await parseReceiptText(tesseractResult.text);

  // Extract expected item count from text
  const expectedItemCount = extractExpectedItemCount(tesseractResult.text);
  console.log(`[Hybrid] Expected item count from receipt: ${expectedItemCount || 'NOT FOUND'}`);

  // STEP 4: Validate and choose best result
  const openaiCount = openaiResult?.items?.length || 0;
  const parserCount = parserResult?.items?.length || 0;

  console.log(`\n[Hybrid] 📊 COMPARISON:`);
  console.log(`[Hybrid] GPT-4o extracted: ${openaiCount} items`);
  console.log(`[Hybrid] Tesseract+Parser extracted: ${parserCount} items`);
  console.log(`[Hybrid] Expected from receipt: ${expectedItemCount || 'unknown'}`);

  // Decision logic with INTELLIGENT MERGE
  let finalResult;

  // Case 1: GPT-4o has items AND matches expected count
  if (openaiResult && openaiCount > 0 && expectedItemCount && openaiCount === expectedItemCount) {
    console.log(`\n[Hybrid] ✅ DECISION: Using GPT-4o Vision (${openaiCount} items)`);
    console.log(`[Hybrid] Reason: Perfect match with expected count (${openaiCount}/${expectedItemCount})`);
    finalResult = { ...openaiResult, method: 'hybrid-openai', confidence: 'high' };  // Upgrade to HIGH
  }
  // Case 2: GPT-4o has items but FEWER than expected - MERGE with Parser
  else if (openaiResult && openaiCount > 0 && expectedItemCount && openaiCount < expectedItemCount) {
    console.log(`\n[Hybrid] ⚠️  GPT-4o incomplete: ${openaiCount}/${expectedItemCount} items`);
    console.log(`[Hybrid] 🔄 Attempting INTELLIGENT MERGE with Tesseract parser...\n`);

    // Merge strategy: Use GPT-4o items + add missing items from Parser
    const mergedItems = [...openaiResult.items];
    const openaiDescriptions = new Set(
      openaiResult.items.map(item => item.description.toLowerCase().replace(/\s+/g, ''))
    );

    let addedCount = 0;
    for (const parserItem of parserResult.items) {
      const normalizedDesc = parserItem.description.toLowerCase().replace(/\s+/g, '');

      // Only add if not already in GPT-4o results
      if (!openaiDescriptions.has(normalizedDesc)) {
        console.log(`[Hybrid] + Adding from parser: "${parserItem.description}" (R$ ${parserItem.amount})`);
        mergedItems.push(parserItem);
        addedCount++;

        // Stop if we reach expected count
        if (mergedItems.length >= expectedItemCount) {
          break;
        }
      }
    }

    console.log(`\n[Hybrid] ✅ DECISION: Using MERGED result (${mergedItems.length} items)`);
    console.log(`[Hybrid] Details: ${openaiCount} from GPT-4o + ${addedCount} from Parser = ${mergedItems.length} total`);
    console.log(`[Hybrid] Match with expected: ${mergedItems.length}/${expectedItemCount} (${Math.round(mergedItems.length/expectedItemCount*100)}%)`);

    finalResult = {
      items: mergedItems,
      metadata: openaiResult.metadata || parserResult.metadata,
      confidence: mergedItems.length === expectedItemCount ? 'high' : 'medium',
      method: 'hybrid-merged',
    };
  }
  // Case 3: No expected count, but both methods have results - choose best
  else if (openaiResult && openaiCount > 0 && parserCount > 0 && !expectedItemCount) {
    // Use whichever has more items (likely more complete)
    if (openaiCount >= parserCount) {
      console.log(`\n[Hybrid] ✅ DECISION: Using GPT-4o Vision (${openaiCount} items)`);
      console.log(`[Hybrid] Reason: More items than parser (${openaiCount} vs ${parserCount})`);

      // Calculate confidence based on total amount match
      let confidence = 'medium';
      if (openaiResult.metadata?.total && parserResult.metadata?.total) {
        const openaiTotal = openaiResult.metadata.total;
        const parserTotal = parserResult.metadata.total;
        const diff = Math.abs(openaiTotal - parserTotal);
        const percentDiff = (diff / parserTotal) * 100;

        if (percentDiff < 1) {
          confidence = 'high';
          console.log(`[Hybrid] ✅ Confidence upgraded to HIGH - total matches (diff: ${percentDiff.toFixed(2)}%)`);
        } else if (percentDiff < 5) {
          confidence = 'medium';
          console.log(`[Hybrid] ⚠️  Confidence: MEDIUM - total close match (diff: ${percentDiff.toFixed(2)}%)`);
        }
      }

      finalResult = { ...openaiResult, method: 'hybrid-openai', confidence };
    } else {
      console.log(`\n[Hybrid] ✅ DECISION: Using Tesseract+Parser (${parserCount} items)`);
      console.log(`[Hybrid] Reason: More items than GPT-4o (${parserCount} vs ${openaiCount})`);
      finalResult = { ...parserResult, method: 'hybrid-parser' };
    }
  }
  // Case 4: Only GPT-4o has results
  else if (openaiResult && openaiCount > 0) {
    console.log(`\n[Hybrid] ✅ DECISION: Using GPT-4o Vision (${openaiCount} items)`);
    console.log(`[Hybrid] Reason: Only GPT-4o extracted items successfully`);
    finalResult = { ...openaiResult, method: 'hybrid-openai' };
  }
  // Case 5: Only Parser has results
  else if (parserCount > 0) {
    console.log(`\n[Hybrid] ✅ DECISION: Using Tesseract+Parser (${parserCount} items)`);
    console.log(`[Hybrid] Reason: GPT-4o unavailable/failed, using parser`);
    finalResult = { ...parserResult, method: 'hybrid-parser' };
  }
  // Case 6: Both failed
  else {
    console.log(`\n[Hybrid] ❌ DECISION: All methods failed`);
    finalResult = {
      items: [],
      metadata: parserResult.metadata || {},
      rawText: tesseractResult.text,
      confidence: 'low',
      method: 'hybrid-failed',
    };
  }

  // Add hybrid metadata
  finalResult.hybridInfo = {
    openaiItemCount: openaiCount,
    parserItemCount: parserCount,
    expectedItemCount: expectedItemCount,
    methodUsed: finalResult.method,
  };

  // Ensure metadata exists
  if (!finalResult.metadata) {
    finalResult.metadata = {};
  }

  // Extract or set date
  if (!finalResult.metadata.date && parserResult.metadata && parserResult.metadata.date) {
    finalResult.metadata.date = parserResult.metadata.date;
    console.log(`[Hybrid] 📅 Date from receipt: ${parserResult.metadata.date}`);
  }

  // If still no date, use today's date
  if (!finalResult.metadata.date) {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    finalResult.metadata.date = `${day}/${month}/${year}`;
    console.log(`[Hybrid] 📅 No date found in receipt, using extraction date: ${finalResult.metadata.date}`);
  }

  // Auto-detect expense category from establishment name
  const establishmentName = extractEstablishmentName(tesseractResult.text);
  const category = detectExpenseCategory(establishmentName);

  finalResult.metadata.establishmentName = establishmentName;
  finalResult.metadata.category = category;

  console.log(`[Hybrid] 🏪 Establishment: ${establishmentName || 'N/A'}`);
  console.log(`[Hybrid] 📂 Auto-detected category: ${category.emoji} ${category.name}`);

  // Set editable flag (frontend can use this to enable editing)
  finalResult.editable = true;

  console.log(`\n✅ HYBRID EXTRACTION COMPLETE`);
  console.log(`📊 Final result: ${finalResult.items.length} items`);
  console.log(`📊 Method: ${finalResult.method}`);
  console.log(`📊 Confidence: ${finalResult.confidence}`);
  console.log(`📊 Date: ${finalResult.metadata.date || 'N/A'}\n`);

  return finalResult;
}

/**
 * Extract establishment name from receipt text
 */
function extractEstablishmentName(text) {
  const lines = text.split('\n');

  // Usually the establishment name is in the first 3 lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();

    // Skip empty lines, CNPJ, addresses
    if (!line ||
        line.match(/CNPJ|CPF|CEP|INSCRI|DOCUMENTO/i) ||
        line.match(/^[0-9\-\/\.\s]+$/) ||
        line.length < 3) {
      continue;
    }

    // First meaningful line is likely the establishment name
    if (line.match(/[A-Za-z]{3,}/)) {
      console.log(`[EstablishmentName] Found: "${line}"`);
      return line;
    }
  }

  return null;
}

/**
 * Detect expense category based on establishment name and items
 */
function detectExpenseCategory(establishmentName) {
  const categories = {
    moradia: {
      id: 'moradia',
      name: 'Moradia',
      emoji: '🏠',
      keywords: ['imobiliaria', 'condominio', 'administradora', 'predial']
    },
    contas_fixas: {
      id: 'contas_fixas',
      name: 'Contas fixas',
      emoji: '⚡',
      keywords: ['energia', 'eletrica', 'cemig', 'copel', 'light', 'sabesp', 'cedae', 'companhia', 'saneamento', 'agua', 'esgoto', 'telefonica', 'vivo', 'tim', 'claro', 'oi', 'net', 'sky']
    },
    supermercado: {
      id: 'supermercado',
      name: 'Supermercado',
      emoji: '🛒',
      keywords: ['supermercado', 'mercado', 'atacadao', 'carrefour', 'extra', 'paes mendonca', 'guanabara', 'walmart', 'assai', 'makro', 'padaria', 'acougue', 'hortifruti', 'quitanda']
    },
    transporte: {
      id: 'transporte',
      name: 'Transporte',
      emoji: '🚗',
      keywords: ['posto', 'combustivel', 'shell', 'ipiranga', 'petrobras', 'br distribuidora', 'ale', 'auto pecas', 'mecanica', 'oficina', 'estacionamento', 'uber', '99', 'detran']
    },
    saude: {
      id: 'saude',
      name: 'Saúde',
      emoji: '💊',
      keywords: ['farmacia', 'drogaria', 'droga', 'raia', 'sao paulo', 'pacheco', 'drogasil', 'ultrafarma', 'clinica', 'hospital', 'laboratorio', 'medico', 'dentista', 'odonto', 'academia', 'smartfit', 'bodytech']
    },
    pessoais: {
      id: 'pessoais',
      name: 'Pessoais e higiene',
      emoji: '👕',
      keywords: ['salao', 'barbearia', 'estetica', 'cosmetico', 'perfumaria', 'boticario', 'natura', 'avon', 'renner', 'riachuelo', 'c&a', 'marisa', 'calcados', 'sapato']
    },
    educacao: {
      id: 'educacao',
      name: 'Educação',
      emoji: '🎓',
      keywords: ['escola', 'colegio', 'universidade', 'faculdade', 'curso', 'livraria', 'papelaria', 'saraiva', 'cultura']
    },
    filhos: {
      id: 'filhos',
      name: 'Filhos e dependentes',
      emoji: '👶',
      keywords: ['bebe', 'infantil', 'crianca', 'brinquedo', 'ri happy', 'pbkids', 'fraldas']
    },
    financeiras: {
      id: 'financeiras',
      name: 'Financeiras',
      emoji: '💳',
      keywords: ['banco', 'itau', 'bradesco', 'santander', 'caixa', 'bb', 'nubank', 'inter', 'financeira', 'credito', 'emprestimo']
    },
    lazer: {
      id: 'lazer',
      name: 'Lazer e bem-estar',
      emoji: '🎉',
      keywords: ['cinema', 'teatro', 'show', 'ingresso', 'viagem', 'turismo', 'hotel', 'pousada', 'parque', 'diversao', 'netflix', 'spotify', 'presente']
    },
    pets: {
      id: 'pets',
      name: 'Pets',
      emoji: '🐾',
      keywords: ['pet', 'veterinari', 'racao', 'animal', 'banho e tosa', 'petshop', 'petz', 'cobasi']
    },
    outras: {
      id: 'outras',
      name: 'Outras eventuais',
      emoji: '💡',
      keywords: []
    }
  };

  // Default category
  let detectedCategory = categories.outras;

  if (establishmentName) {
    const nameLower = establishmentName.toLowerCase();

    // Check each category's keywords
    for (const [key, category] of Object.entries(categories)) {
      for (const keyword of category.keywords) {
        if (nameLower.includes(keyword.toLowerCase())) {
          detectedCategory = category;
          console.log(`[CategoryDetection] Matched keyword "${keyword}" → ${category.emoji} ${category.name}`);
          // Remove keywords before returning (frontend doesn't need them)
          const { keywords, ...categoryWithoutKeywords } = detectedCategory;
          return categoryWithoutKeywords;
        }
      }
    }
  }

  console.log(`[CategoryDetection] No match found, using default: ${detectedCategory.emoji} ${detectedCategory.name}`);
  // Remove keywords before returning (frontend doesn't need them)
  const { keywords, ...categoryWithoutKeywords } = detectedCategory;
  return categoryWithoutKeywords;
}

/**
 * Helper function to extract expected item count from receipt text
 */
function extractExpectedItemCount(text) {
  const lines = text.split('\n');

  // First pass: Search full text for item count pattern (case-insensitive)
  const fullTextPattern = /(?:QTD\.?|QTDE\.?|QUANTIDADE)\s*TOTAL\s*(?:DE\s*)?(?:ITEN[S]?|PRODUTOS)[:\s]*0*(\d{1,3})/i;
  const fullMatch = text.match(fullTextPattern);
  if (fullMatch) {
    const count = parseInt(fullMatch[1], 10);
    console.log(`[ExpectedCount] ✓ Found in full text: ${count} (raw: "${fullMatch[1]}")`);
    return count;
  }

  // Second pass: Line-by-line with very flexible patterns
  for (const line of lines) {
    // Log any line that mentions QTD or ITEN
    if (line.match(/QTD|QTDE|ITEN/i)) {
      console.log(`[ExpectedCount] Checking line: "${line}"`);

      // Pattern variations
      const patterns = [
        /QTD\.?\s*TOTAL\s*DE\s*ITEN[S]?\s+0*(\d{2,3})/i,
        /QTDE?\.?\s+TOTAL\s+(?:DE\s+)?ITEN[S]?\s+0*(\d{2,3})/i,
        /TOTAL\s+(?:DE\s+)?ITEN[S]?\s+0*(\d{2,3})/i,
        /ITEN[S]?\s+0*(\d{2,3})\s*$/i,
        /(\d{2,3})\s+ITEN[S]?/i
      ];

      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const count = parseInt(match[1], 10);
          if (count >= 1 && count <= 999) {
            console.log(`[ExpectedCount] ✓ Found expected count: ${count} (pattern matched)`);
            return count;
          }
        }
      }
    }
  }

  // Third pass: Look for "TOTAL" followed by a 2-3 digit number
  for (const line of lines) {
    if (line.match(/TOTAL/i)) {
      const numbers = line.match(/\b(\d{2,3})\b/g);
      if (numbers && numbers.length > 0) {
        // Filter out numbers that are obviously not item counts (like years, addresses)
        const filtered = numbers.filter(n => {
          const num = parseInt(n, 10);
          return num >= 5 && num <= 200; // Reasonable item count range
        });

        if (filtered.length > 0) {
          const count = parseInt(filtered[filtered.length - 1], 10);
          console.log(`[ExpectedCount] ⚠️  Inferred count from TOTAL line: ${count}`);
          return count;
        }
      }
    }
  }

  console.log(`[ExpectedCount] ❌ No expected count found in receipt`);
  return null;
}

/**
 * Get all available expense categories for frontend dropdown
 */
function getExpenseCategories() {
  return [
    { id: 'moradia', name: 'Moradia', emoji: '🏠' },
    { id: 'contas_fixas', name: 'Contas fixas', emoji: '⚡' },
    { id: 'supermercado', name: 'Supermercado', emoji: '🛒' },
    { id: 'transporte', name: 'Transporte', emoji: '🚗' },
    { id: 'saude', name: 'Saúde', emoji: '💊' },
    { id: 'pessoais', name: 'Pessoais e higiene', emoji: '👕' },
    { id: 'educacao', name: 'Educação', emoji: '🎓' },
    { id: 'filhos', name: 'Filhos e dependentes', emoji: '👶' },
    { id: 'financeiras', name: 'Financeiras', emoji: '💳' },
    { id: 'lazer', name: 'Lazer e bem-estar', emoji: '🎉' },
    { id: 'pets', name: 'Pets', emoji: '🐾' },
    { id: 'outras', name: 'Outras eventuais', emoji: '💡' }
  ];
}

/**
 * Get all available income categories for frontend dropdown
 */
function getIncomeCategories() {
  return [
    { id: 'salario', name: 'Salário', emoji: '💰' },
    { id: 'freelance', name: 'Freelance', emoji: '💼' },
    { id: 'investimentos', name: 'Investimentos', emoji: '📈' },
    { id: 'aluguel', name: 'Aluguel recebido', emoji: '🏘️' },
    { id: 'pensao', name: 'Pensão', emoji: '👨‍👩‍👧' },
    { id: 'premio', name: 'Prêmios e bônus', emoji: '🎁' },
    { id: 'vendas', name: 'Vendas', emoji: '🛍️' },
    { id: 'restituicao', name: 'Restituição', emoji: '💵' },
    { id: 'outras_receitas', name: 'Outras receitas', emoji: '💡' }
  ];
}

module.exports = {
  extractReceiptData,
  preprocessImage,
  extractWithTesseract,
  extractWithOpenAI,
  parseReceiptText,
  getExpenseCategories,
  getIncomeCategories,
};
