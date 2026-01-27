const mongoose = require('mongoose');
const { formatDate } = require('../utils/appUtil');
const { toTitleCase } = require('../utils/appUtil');

const { Schema } = mongoose;

const transactionCategories = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

transactionCategories.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;

    ret.name = toTitleCase(ret.name);

    ret.createdAt = formatDate(ret.createdAt);
    ret.updatedAt = formatDate(ret.updatedAt);
    // remove version key
    delete ret.__v;

    return ret;
  },
});

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
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransactionCategory',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
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
    bankCode: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

transactionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;

    ret.createdAt = formatDate(ret.createdAt);
    ret.updatedAt = formatDate(ret.updatedAt);
    ret.categoryId = ret.categoryId.toString();
    // remove version key
    delete ret.__v;

    return ret;
  },
});

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
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    serviceID: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    customerName: {
      type: String,
      required: false,
    },
    customerAddress: {
      type: String,
      required: false,
    },
    token: {
      type: String,
      required: false,
    },
    unit: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = {
  Transaction: mongoose.model('Transaction', transactionSchema),
  BillTransaction: mongoose.model('BillTransaction', billTransactionSchema),
  TransactionCategory: mongoose.model('TransactionCategory', transactionCategories),
};
