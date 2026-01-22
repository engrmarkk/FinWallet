const { BankAccount, Wallet } = require('../models/userModel');

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

module.exports = {
  getBankAccountByUser,
  getUserWalletByUser,
  getBankAccountByAccountNumber,
  getUserBalance,
};
