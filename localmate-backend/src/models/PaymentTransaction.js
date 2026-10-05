const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      index: true,
    },
    orderCode: {
      type: Number,
      required: true,
      unique: true,
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
      enum: ['PENDING', 'PAID', 'CANCELLED', 'FAILED'],
      default: 'PENDING',
    },
    checkoutUrl: {
      type: String,
      default: '',
    },
    paymentLinkId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema, 'payment_transactions');
