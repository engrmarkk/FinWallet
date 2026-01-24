const { Transaction, BillTransaction, TransactionCategory } = require('../models/transactionModel');
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
  if (!category) {
    category = await createTransactionCategory(name);
  }
  return category;
};

// get transaction category by id
const getTransactionCategoryById = async (id) => {
  return await TransactionCategory.findById(id);
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

module.exports = {
  createTransactionCategory,
  createTransaction,
  createBillTransaction,
  getTransactionCategoryByName,
  getTransactionCategoryById,
  getTransactionCategories,
  creditOrDebitUserWallet,
  getTransactionByReference,
};
