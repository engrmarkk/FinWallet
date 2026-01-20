const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
    },
    bvn: {
      type: String,
      required: false,
      unique: true,
      index: true,
    },
    nin: {
      type: String,
      required: false,
      unique: true,
      index: true,
    },
    accountLevel: {
      type: String,
      enum: ['level 1', 'level 2', 'level 3', 'premium', 'enterprise'],
      default: 'level 1',
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      unique: true,
      index: true,
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// user session
const userSessionSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: false,
    },
    token: {
      type: String,
      required: false,
    },
    otp_expires: {
      type: Date,
      required: false,
    },
    token_expires: {
      type: Date,
      required: false,
    },
    otp_valid: {
      type: Boolean,
      default: true,
    },
    token_valid: {
      type: Boolean,
      default: true,
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// user wallet
const walletSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    balance: {
      type: Number,
      required: true,
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = {
  User: mongoose.model('User', userSchema),
  UserSession: mongoose.model('UserSession', userSessionSchema),
  Wallet: mongoose.model('Wallet', walletSchema),
};
