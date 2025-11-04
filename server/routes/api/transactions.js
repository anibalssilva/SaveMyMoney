const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const { Parser } = require('json2csv');
const xlsx = require('xlsx');
const multer = require('multer');
const { createWorker } = require('tesseract.js');
// const pdf = require('pdf-parse'); // Temporarily disabled due to ESM import issue
const { extractReceiptData, getExpenseCategories, getIncomeCategories } = require('../../services/advancedOCR');
const { getSubcategoriesByCategory, detectSubcategory } = require('../../services/subcategoryDetector');

const Transaction = require('../../models/Transaction');
const Budget = require('../../models/Budget');

// Helpers
function normalizeDateInput(input) {
  if (!input) return undefined;
  try {
    // If comes as 'YYYY-MM-DD'
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [y, m, d] = input.split('-').map(n => parseInt(n, 10));
      return new Date(y, m - 1, d, 12, 0, 0); // noon local to avoid TZ shift
    }
    const dateObj = new Date(input);
    if (!isNaN(dateObj.getTime())) {
      // shift to noon if time is 00:00 to guard against TZ display shift
      if (dateObj.getHours() === 0 && dateObj.getMinutes() === 0) {
        dateObj.setHours(12, 0, 0, 0);
      }
      return dateObj;
    }
  } catch (e) {
    // ignore and fallback
  }
  return undefined;
}

// @route   POST api/transactions
// @desc    Create a transaction
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('description', 'Description is required').not().isEmpty(),
      check('amount', 'Amount is required').isNumeric(),
      check('category', 'Category is required').not().isEmpty(),
      check('type', 'Type is required and must be expense or income').isIn([
        'expense',
        'income',
      ]),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, amount, date, category, type, subcategoryId, notes, paymentMethod } = req.body;

    try {
      // Try to enrich subcategory name from mapping (if provided)
      let subcategoryName;
      if (subcategoryId && type === 'expense') {
        try {
          const subs = getSubcategoriesByCategory(category);
          const found = Array.isArray(subs) ? subs.find(s => s.id === subcategoryId) : null;
          if (found) subcategoryName = found.name;
        } catch (e) {
          // fail silently
        }
      }

      const newTransaction = new Transaction({
        user: req.user.id,
        description,
        amount,
        date: normalizeDateInput(date),
        category,
        subcategoryId: subcategoryId || undefined,
        subcategory: subcategoryName,
        type,
        notes: notes || '',
        paymentMethod: paymentMethod || '',
      });

      const transaction = await newTransaction.save();

      let budgetAlert = null;
      if (type === 'expense') {
        const budget = await Budget.findOne({ user: req.user.id, category });

        if (budget) {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

          const categoryExpenses = await Transaction.aggregate([
            {
              $match: {
                user: new mongoose.Types.ObjectId(req.user.id),
                category,
                type: 'expense',
                date: { $gte: startOfMonth, $lte: endOfMonth },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' },
              },
            },
          ]);

          const totalSpent = categoryExpenses.length > 0 ? categoryExpenses[0].total : 0;

          if (totalSpent > budget.limit) {
            budgetAlert = {
              category,
              limit: budget.limit,
              totalSpent,
              message: `Você ultrapassou seu orçamento de R${budget.limit.toFixed(2)} para a categoria \"${category}\". Total de gastos: R${totalSpent.toFixed(2)}.`,
            };
          }
        }
      }

      res.json({ transaction, budgetAlert });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/transactions
// @desc    Get all transactions for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/transactions/:id
// @desc    Update a transaction
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { description, amount, date, category, type, subcategoryId, notes, paymentMethod } = req.body;

  // Build transaction object
  const transactionFields = {};
  if (description) transactionFields.description = description;
  if (amount) transactionFields.amount = amount;
  if (date) transactionFields.date = normalizeDateInput(date);
  if (category) transactionFields.category = category;
  if (type) transactionFields.type = type;
  if (typeof notes !== 'undefined') transactionFields.notes = notes;
  if (typeof paymentMethod !== 'undefined') transactionFields.paymentMethod = paymentMethod;
  if (typeof subcategoryId !== 'undefined') {
    transactionFields.subcategoryId = subcategoryId || undefined;
    // Try to map subcategory name based on current/new category
    const categoryId = category || undefined;
    try {
      if (subcategoryId && (categoryId || transactionFields.category)) {
        const cat = categoryId || (await Transaction.findById(req.params.id)).category;
        const subs = getSubcategoriesByCategory(cat);
        const found = Array.isArray(subs) ? subs.find(s => s.id === subcategoryId) : null;
        transactionFields.subcategory = found ? found.name : undefined;
      } else if (!subcategoryId) {
        transactionFields.subcategory = undefined;
      }
    } catch (e) {
      // ignore mapping errors
    }
  }

  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) return res.status(404).json({ msg: 'Transaction not found' });

    // Make sure user owns transaction
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: transactionFields },
      { new: true }
    );

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'ID de transação inválido' });
    }

    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ msg: 'Transação não encontrada' });
    }

    // Make sure user owns transaction
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Não autorizado a excluir esta transação' });
    }

    // Use findByIdAndDelete instead of deprecated findByIdAndRemove
    await Transaction.findByIdAndDelete(req.params.id);

    console.log(`✅ Transaction ${req.params.id} deleted successfully by user ${req.user.id}`);

    res.json({ msg: 'Transação removida com sucesso', id: req.params.id });
  } catch (err) {
    console.error('❌ Delete transaction error:', err.message);
    res.status(500).json({
      msg: 'Erro ao excluir transação',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET api/transactions/export
// @desc    Export transactions to CSV or XLSX
// @access  Private
router.get('/export', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({
      date: -1,
    });

    const format = req.query.format || 'csv';

    if (format === 'csv') {
      const fields = ['description', 'amount', 'date', 'category', 'type'];
      const opts = { fields };
      const parser = new Parser(opts);
      const csv = parser.parse(transactions.map(t => t.toObject()));
      res.header('Content-Type', 'text/csv');
      res.attachment('transactions.csv');
      res.send(csv);
    } else if (format === 'xlsx') {
      const transactionsData = transactions.map(t => t.toObject());
      const worksheet = xlsx.utils.json_to_sheet(transactionsData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.attachment('transactions.xlsx');
      res.send(buffer);
    } else {
      res.status(400).json({ msg: 'Invalid format' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// @route   GET api/transactions/categories
// @desc    Get all available expense categories
// @access  Private
router.get('/categories', auth, (req, res) => {
  try {
    const categories = getExpenseCategories();
    res.json(categories);
  } catch (err) {
    console.error('❌ Error fetching categories:', err.message);
    res.status(500).json({ msg: 'Erro ao buscar categorias' });
  }
});

// @route   GET api/transactions/income-categories
// @desc    Get all available income categories
// @access  Private
router.get('/income-categories', auth, (req, res) => {
  try {
    const categories = getIncomeCategories();
    res.json(categories);
  } catch (err) {
    console.error('❌ Error fetching income categories:', err.message);
    res.status(500).json({ msg: 'Erro ao buscar categorias de receita' });
  }
});

// @route   GET api/transactions/subcategories/:categoryId
// @desc    Get all subcategories for a specific main category
// @access  Private
router.get('/subcategories/:categoryId', auth, (req, res) => {
  try {
    const { categoryId } = req.params;
    console.log(`📂 Fetching subcategories for category: ${categoryId}`);

    const subcategories = getSubcategoriesByCategory(categoryId);

    console.log(`✅ Found ${subcategories.length} subcategories for ${categoryId}`);
    res.json(subcategories);
  } catch (err) {
    console.error('❌ Error fetching subcategories:', err.message);
    res.status(500).json({ msg: 'Erro ao buscar subcategorias' });
  }
});

// @route   POST api/transactions/backfill-subcategories
// @desc    Backfill missing subcategoryId/subcategory for user's expense transactions using detector
// @access  Private
router.post('/backfill-subcategories', auth, async (req, res) => {
  try {
    const query = { user: req.user.id, type: 'expense' };
    const all = await Transaction.find(query).lean();
    let updated = 0;

    for (const t of all) {
      if (!t.subcategoryId && t.category) {
        const sub = detectSubcategory(t.description || '', t.category);
        await Transaction.findByIdAndUpdate(t._id, {
          $set: {
            subcategoryId: sub?.id || 'outros',
            subcategory: sub?.name || 'Outros'
          }
        });
        updated++;
      }
    }

    res.json({ success: true, updated });
  } catch (err) {
    console.error('❌ Error backfilling subcategories:', err.message);
    res.status(500).json({ msg: 'Erro ao backfill de subcategorias' });
  }
});

// @route   POST api/transactions/backfill-dates
// @desc    Adjust stored transaction dates to local 12:00 to prevent -1 day TZ shift
// @access  Private
router.post('/backfill-dates', auth, async (req, res) => {
  try {
    const txs = await Transaction.find({ user: req.user.id }).lean();
    let scanned = 0;
    let updated = 0;

    for (const t of txs) {
      scanned++;
      if (!t.date) continue;
      const d = new Date(t.date);
      if (isNaN(d.getTime())) continue;
      const isMidnightLocal = d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0;
      const isMidnightUTC = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
      if (isMidnightLocal || isMidnightUTC) {
        d.setHours(12, 0, 0, 0);
        await Transaction.updateOne({ _id: t._id }, { $set: { date: d } });
        updated++;
      }
    }

    res.json({ success: true, scanned, updated });
  } catch (err) {
    console.error('❌ Error backfilling dates:', err.message);
    res.status(500).json({ msg: 'Erro ao ajustar datas' });
  }
});

// @route   POST api/transactions/ocr
// @desc    Extract data from receipt image (does NOT save to database)
// @access  Private
router.post('/ocr', [auth, upload.single('receipt')], async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded.' });
  }

  console.log('📸 Received receipt image:', req.file.originalname, `(${(req.file.size / 1024).toFixed(2)} KB)`);

  try {
    // Use the advanced OCR service
    const result = await extractReceiptData(req.file.buffer);

    console.log(`✅ Extraction complete: ${result.items.length} items found`);
    console.log(`📊 Method: ${result.method}, Confidence: ${result.confidence}`);

    if (result.items.length === 0) {
      return res.status(400).json({
        msg: 'Não foi possível extrair itens do cupom. Tente tirar uma foto mais nítida, com boa iluminação e foco nos produtos e valores.',
        details: result.details,
        suggestions: [
          '💡 Use boa iluminação natural',
          '💡 Mantenha o cupom reto e plano',
          '💡 Foque na área dos produtos',
          '💡 Evite sombras e reflexos',
          '💡 Se possível, escaneie ao invés de fotografar'
        ]
      });
    }

    // Format items for frontend (NOT saving to database yet)
    // Use auto-detected category for all items
    const autoCategory = result.metadata.category || { id: 'outras', name: 'Outras eventuais', emoji: '💡' };

    // Detect subcategory for each item
    const extractedItems = result.items.map(item => {
      const subcategory = detectSubcategory(item.description, autoCategory.id);

      return {
        description: item.description,
        amount: item.amount,
        category: autoCategory.name,
        categoryId: autoCategory.id,
        subcategory: subcategory.name,
        subcategoryId: subcategory.id,
        subcategoryEmoji: subcategory.emoji,
        subcategoryAutoDetected: true, // Flag to show "Auto-detectado" badge
        type: 'expense'
      };
    });

    // Return extraction results WITHOUT saving to database
    res.json({
      items: extractedItems,
      metadata: {
        // Receipt metadata (establishment, CNPJ, date, payment method, etc.)
        ...result.metadata,
        // Extraction metadata
        totalItems: extractedItems.length,
        totalAmount: extractedItems.reduce((sum, t) => sum + t.amount, 0),
        method: result.method,
        confidence: result.confidence,
        extractionDetails: result.details,
        // Auto-detected category
        autoCategory: autoCategory,
        establishmentName: result.metadata.establishmentName
      },
      // Include editable flag for frontend
      editable: result.editable
    });

  } catch (err) {
    console.error('❌ OCR Error:', err.message);
    res.status(500).json({
      msg: 'Erro ao processar a imagem. Tente novamente.',
      error: err.message,
      suggestions: [
        'Verifique se a imagem está clara e legível',
        'Tente tirar uma nova foto com melhor iluminação',
        'Se o problema persistir, tente fazer upload de um arquivo de imagem de maior qualidade'
      ]
    });
  }
});

// @route   POST api/transactions/ocr/save
// @desc    Save reviewed OCR extracted transactions to database
// @access  Private
router.post('/ocr/save', [auth], async (req, res) => {
  const { items, metadata } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ msg: 'Nenhum item para salvar.' });
  }

  try {
    // Use date from metadata if available, otherwise use current date
    const transactionDate = metadata?.date
      ? parseBrazilianDate(metadata.date)
      : (function(){ const d=new Date(); d.setHours(12,0,0,0); return d; })();

    // Convert items to transactions
    const transactionsToCreate = items.map(item => ({
      user: req.user.id,
      description: item.description,
      amount: item.amount,
      category: item.categoryId || item.category || 'ocr_upload',
      subcategoryId: item.subcategoryId || undefined,
      subcategory: item.subcategory || undefined,
      type: item.type || 'expense',
      date: transactionDate
    }));

    // Save to database
    const createdTransactions = await Transaction.insertMany(transactionsToCreate);

    console.log(`✅ Saved ${createdTransactions.length} transactions to database`);

    res.json({
      success: true,
      transactions: createdTransactions,
      message: `${createdTransactions.length} transação(ões) salva(s) com sucesso!`
    });

  } catch (err) {
    console.error('❌ Error saving transactions:', err.message);
    res.status(500).json({
      msg: 'Erro ao salvar transações no banco de dados.',
      error: err.message
    });
  }
});

// Helper function to parse Brazilian date format (DD/MM/YYYY)
function parseBrazilianDate(dateStr) {
  if (!dateStr) return new Date();

  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(parseInt(year,10), parseInt(month,10) - 1, parseInt(day,10), 12, 0, 0);
  }

  return new Date();
}

// @route   POST api/transactions/pdf
// @desc    Create transactions from a PDF bank statement
// @access  Private
router.post('/pdf', [auth, upload.single('statement')], async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded.' });
  }

  try {
    // Temporarily disabled due to ESM import issue with pdf-parse
    return res.status(503).json({ msg: 'PDF upload temporarily unavailable' });
    // const data = await pdf(req.file.buffer);
    // const text = data.text;

    // Regex to capture transactions from a bank statement.
    // This is a flexible starting point and may need adjustments for specific bank formats.
    // It looks for a date (dd/mm), a description, and a BRL amount, ignoring lines like "SALDO ANTERIOR".
    const regex = /^(\d{2}\/\d{2})\s+(?!SALDO ANTERIOR)(.+?)\s+([\d.,]+(?:\s*[CD])?)$/gm;
    
    let match;
    const transactionsToCreate = [];
    const currentYear = new Date().getFullYear();

    while ((match = regex.exec(text)) !== null) {
      const dateStr = match[1];
      let description = match[2].trim();
      const amountStrWithIndicator = match[3].trim();

      let type = 'expense'; // Default to expense
      let amountStr = amountStrWithIndicator;

      if (amountStrWithIndicator.endsWith(' C')) {
        type = 'income';
        amountStr = amountStrWithIndicator.slice(0, -2).trim();
      } else if (amountStrWithIndicator.endsWith(' D')) {
        type = 'expense';
        amountStr = amountStrWithIndicator.slice(0, -2).trim();
      }

      const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
      
      if (isNaN(amount) || amount === 0) continue;
      
      const [day, month] = dateStr.split('/');
      const date = new Date(currentYear, parseInt(month,10)-1, parseInt(day,10), 12, 0, 0);

      transactionsToCreate.push({
        user: req.user.id,
        description,
        amount: Math.abs(amount),
        date,
        category: 'PDF Upload',
        type,
      });
    }

    if (transactionsToCreate.length === 0) {
      return res.status(400).json({ msg: 'Could not extract any transactions from the PDF. Please check the statement format.' });
    }

    const createdTransactions = await Transaction.insertMany(transactionsToCreate);
    res.json(createdTransactions);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error during PDF processing.');
  }
});

module.exports = router;
