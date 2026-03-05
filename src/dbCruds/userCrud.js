const { BankAccount, Wallet, User } = require('../models/userModel');
const { Beneficiary } = require('../models/transactionModel');
const { hashPassword } = require('../utils/appUtil');

// get bank account by userId, if not found create one
const getBankAccountByUser = async (user) => {
  let bankAccount = await BankAccount.findOne({ userId: user._id });
  if (!bankAccount) {
    const fullName = `${user.lastName} ${user.firstName}`;
    const bankAccount = new BankAccount({
      userId: user._id,
      accountName: fullName,
    });
    await bankAccount.save();
  }
  return bankAccount.toJSON();
};

// get bank account by account number
const getBankAccountByAccountNumber = async (accountNumber) => {
  return await BankAccount.findOne({ accountNumber });
};

const getUserWalletByUser = async (user) => {
  const wallet = await Wallet.findOne({ userId: user._id });
  if (!wallet) {
    const newWallet = new Wallet({
      userId: user._id,
      balance: 0,
    });
    return await newWallet.save();
  }
  return wallet.toJSON();
};

// get user balance
const getUserBalance = async (userId) => {
  const wallet = await Wallet.findOne({ userId });
  return wallet.balance;
};

const setTransactionPin = async (userId, pin) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  user.transaction_pin = await hashPassword(pin);
  await user.save();
};

// get user beneficiaries
const getUserBeneficiaries = async (userId) => {
  return await Beneficiary.find({ userId });
};

module.exports = {
  getBankAccountByUser,
  getUserWalletByUser,
  getBankAccountByAccountNumber,
  getUserBalance,
  setTransactionPin,
  getUserBeneficiaries,
};
