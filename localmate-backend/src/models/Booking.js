const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    travelerId: {
      type: String,
      required: true,
      index: true,
    },
    helperId: {
      type: String,
      required: true,
      index: true,
    },
    tourName: {
      type: String,
      default: 'Local Experience Tour',
    },
    bookingDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    durationHours: {
      type: Number,
      default: 4,
    },
    meetLocation: {
      type: String,
      default: '',
    },
    specialRequests: {
      type: String,
      default: '',
    },
    totalPrice: {
      type: Number,
      default: 48.0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PAID', 'REFUNDED'],
      default: 'UNPAID',
    },
    startTime: {
      type: String,
      default: '09:00',
    },
    endTime: {
      type: String,
      default: '13:00',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    },

    // Realtime Location Sharing
    customerLatitude: { type: Number, default: null },
    customerLongitude: { type: Number, default: null },
    customerLocationUpdatedAt: { type: Date, default: null },
    customerSharingLocation: { type: Boolean, default: false },

    helperLatitude: { type: Number, default: null },
    helperLongitude: { type: Number, default: null },
    helperLocationUpdatedAt: { type: Date, default: null },
    helperSharingLocation: { type: Boolean, default: false },
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

module.exports = mongoose.model('Booking', bookingSchema, 'bookings');
