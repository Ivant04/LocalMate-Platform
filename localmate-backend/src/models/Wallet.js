const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ESCROW_RELEASE', 'WITHDRAWAL', 'BONUS', 'ADJUSTMENT'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'PENDING', 'FAILED'],
    default: 'SUCCESS',
  },
  bankInfo: {
    bankName: String,
    accountNumber: String,
    accountHolder: String,
  },
  bookingId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    availableBalance: {
      type: Number,
      default: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    bankAccount: {
      bankName: { type: String, default: 'Vietcombank' },
      accountNumber: { type: String, default: '' },
      accountHolder: { type: String, default: '' },
    },
    transactions: [transactionSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Wallet', walletSchema);
