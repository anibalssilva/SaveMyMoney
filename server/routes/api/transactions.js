const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const { Parser } = require('json2csv');
const xlsx = require('xlsx');
const multer = require('multer');
const { createWorker } = require('tesseract.js');
const pdf = require('pdf-parse');

const Transaction = require('../../models/Transaction');
const Budget = require('../../models/Budget');

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

    const { description, amount, date, category, type } = req.body;

    try {
      const newTransaction = new Transaction({
        user: req.user.id,
        description,
        amount,
        date,
        category,
        type,
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
  const { description, amount, date, category, type } = req.body;

  // Build transaction object
  const transactionFields = {};
  if (description) transactionFields.description = description;
  if (amount) transactionFields.amount = amount;
  if (date) transactionFields.date = date;
  if (category) transactionFields.category = category;
  if (type) transactionFields.type = type;

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
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) return res.status(404).json({ msg: 'Transaction not found' });

    // Make sure user owns transaction
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Transaction.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Transaction removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
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

// @route   POST api/transactions/ocr
// @desc    Create transactions from a receipt image
// @access  Private
router.post('/ocr', [auth, upload.single('receipt')], async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded.' });
  }

  const worker = await createWorker();

  try {
    await worker.load();
    await worker.loadLanguage('por'); // Language set to Portuguese
    await worker.initialize('por');

    const {
      data: { text },
    } = await worker.recognize(req.file.buffer);

    // Regex to find lines with a description and a BRL amount (e.g., "Product Name R$ 12,34")
    const regex = /(.+?)\s+R\$\s*([\d,]+\.?\d{2})/g;
    let match;
    const transactionsToCreate = [];

    // A more general regex for items that might not have R$
    const generalRegex = /(.+?)\s+([\d,]+\.?\d{2})/g;

    const processMatches = (regex, text) => {
        while ((match = regex.exec(text)) !== null) {
            let description = match[1].trim();
            // Clean up description from common OCR noise and irrelevant lines
            if (description.length < 3 || description.toLowerCase().match(/total|subtotal|impostos|troco|desconto/)) {
                continue;
            }
            
            const amount = parseFloat(match[2].replace('.', '').replace(',', '.'));

            if (!isNaN(amount) && amount > 0) {
                transactionsToCreate.push({
                user: req.user.id,
                description: description,
                amount: amount,
                category: 'OCR Upload', // Default category
                type: 'expense',
                });
            }
        }
    }

    processMatches(regex, text);
    // If the R$ specific regex found nothing, try a more general one
    if(transactionsToCreate.length === 0){
        processMatches(generalRegex, text);
    }

    if (transactionsToCreate.length === 0) {
        return res.status(400).json({ msg: 'Could not extract any transactions from the image. Text found: ' + text });
    }

    const createdTransactions = await Transaction.insertMany(transactionsToCreate);
    res.json(createdTransactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error during OCR processing.');
  } finally {
    await worker.terminate();
  }
});

// @route   POST api/transactions/pdf
// @desc    Create transactions from a PDF bank statement
// @access  Private
router.post('/pdf', [auth, upload.single('statement')], async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded.' });
  }

  try {
    const data = await pdf(req.file.buffer);
    const text = data.text;

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
      const date = new Date(`${currentYear}-${month}-${day}`);

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
