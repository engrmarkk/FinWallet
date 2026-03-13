const {
  Transaction,
  BillTransaction,
  TransactionCategory,
  Beneficiary,
} = require('../models/transactionModel');
const { Wallet } = require('../models/userModel');
const Logger = require('../utils/logger');

const logger = new Logger();

// credit or debit user wallet
const creditOrDebitUserWallet = async (userId, amount, type) => {
  const wallet = await Wallet.findOne({ userId });
  if (wallet) {
    if (type === 'credit') {
      wallet.balance += amount;
    } else if (type === 'debit') {
      wallet.balance -= amount;
    }
    return await wallet.save();
  }
  return null;
};

// category exists
const getTransactionCategoryByName = async (name) => {
  const category = await TransactionCategory.findOne({ name });
  // if category does not exist create it
  //   if (!category) {
  //     category = await createTransactionCategory(name);
  //   }
  return category;
};

const getTransactions = async (page, limit, filter, userId) => {
  // Add userId to the filter
  const userFilter = { ...filter, userId }; // or { ...filter, user: userId } depending on your schema field name
  
  // 1) Get total count for pagination (using the filter with userId)
  const totalItems = await Transaction.countDocuments(userFilter);

  // 2) Calculate total pages
  const totalPages = Math.ceil(totalItems / limit);

  // 3) Fetch transactions with pagination (using the filter with userId)
  const transactions = await Transaction.find(userFilter)
    .populate({ path: 'categoryId', select: 'name', options: { lean: true } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const parsedTransactions = transactions.map((t) => t.toJSON());

  const BILL_CATEGORIES = ['airtime', 'cable', 'electricity', 'data'];

  const billTransactionIds = parsedTransactions
    .filter((t) => BILL_CATEGORIES.includes(t.category?.toLowerCase()))
    .map((t) => t.id);

  if (billTransactionIds.length > 0) {
    const billTransactions = await BillTransaction.find({
      transactionId: { $in: billTransactionIds },
    });

    const parsedBills = billTransactions.map((b) => b.toJSON());

    const billMap = {};
    for (const bill of parsedBills) {
      billMap[bill.transactionId.toString()] = bill;
    }

    for (const tx of parsedTransactions) {
      if (billMap[tx.id]) {
        tx.bill = billMap[tx.id];
      }
    }
  }

  // 4) Return both data and pagination metadata
  return {
    data: parsedTransactions,
    pagination: {
      page,
      perPage: limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// get transaction category by id
const getTransactionCategoryById = async (id) => {
  return await TransactionCategory.findById(id);
};

// get transaction by id
const getTransactionById = async (reference) => {
  return await Transaction.findOne({ reference });
};

// create transaction category
const createTransactionCategory = async (name) => {
  logger.info(`Creating transaction category with name: ${name}`);
  const lowerName = name.toLowerCase();
  const existingCategory = await getTransactionCategoryByName(lowerName);
  if (existingCategory) {
    return existingCategory;
  }
  const newCategory = new TransactionCategory({ name: lowerName });
  return await newCategory.save();
};

// get transaction categories
const getTransactionCategories = async () => {
  const categories = await TransactionCategory.find();
  return categories.map((c) => c.toJSON());
};

// create transaction
const createTransaction = async (
  userId,
  amount,
  type,
  categoryId,
  status,
  narration,
  reference,
  bankName = '',
  accountNumber = '',
  accountName = '',
  bankCode = ''
) => {
  const newTransaction = new Transaction({
    userId,
    amount,
    type,
    categoryId,
    status,
    narration,
    reference,
    bankName,
    accountNumber,
    accountName,
    bankCode,
  });
  return await newTransaction.save();
};

// create bill transaction
const createBillTransaction = async (
  userId,
  amount,
  type,
  categoryId,
  status,
  narration,
  reference,
  billerName,
  billerType,
  billerCode,
  serviceID
) => {
  const transaction = await createTransaction(
    userId,
    amount,
    type,
    categoryId,
    status,
    narration,
    reference
  );
  const newBillTransaction = new BillTransaction({
    userId,
    transactionId: transaction._id,
    billerName,
    billerType,
    billerCode,
    amount,
    status,
    reference,
    serviceID,
  });
  await newBillTransaction.save();
  return transaction;
};

// get one transaction by reference
const getTransactionByReference = async (reference) => {
  return await Transaction.findOne({ reference, status: 'completed' });
};

// save beneficiary if it does not exist
const saveUserBeneficiary = async (userId, bankName, accountNumber, accountName, bankCode) => {
  // Check only for the unique things (Account + Bank) for that specific User
  let beneficiary = await Beneficiary.findOne({ userId, accountNumber, bankCode });

  if (!beneficiary) {
    beneficiary = new Beneficiary({ userId, bankName, accountNumber, accountName, bankCode });
    await beneficiary.save();
    logger.info(`Saved new beneficiary for user ${userId}: ${bankName} ${accountNumber}`);
  } else {
    logger.info(`Beneficiary already exists for user ${userId}: ${bankName} ${accountNumber}`);
  }

  return beneficiary;
};

module.exports = {
  createTransactionCategory,
  createTransaction,
  createBillTransaction,
  getTransactionCategoryByName,
  getTransactionCategoryById,
  getTransactionCategories,
  creditOrDebitUserWallet,
  getTransactionByReference,
  getTransactionById,
  getTransactions,
  saveUserBeneficiary,
};
