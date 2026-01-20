const mongoose = require('mongoose');

const { Schema } = mongoose;

const transactionCategories = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// user account schema
const transactionSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransactionCategory',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    narration: {
      type: String,
      required: false,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bankName: {
      type: String,
      required: false,
    },
    accountNumber: {
      type: String,
      required: false,
    },
    accountName: {
      type: String,
      required: false,
    },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// bill payment model
const billTransactionSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
      index: true,
    },
    billerName: {
      type: String,
      required: false,
    },
    billerType: {
      type: String,
      required: false,
    },
    billerCode: {
      type: String,
      required: false,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = {
  Transaction: mongoose.model('Transaction', transactionSchema),
  BillTransaction: mongoose.model('BillTransaction', billTransactionSchema),
  TransactionCategory: mongoose.model('TransactionCategory', transactionCategories),
};
