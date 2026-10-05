const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      default: 'LocalMate User',
      trim: true,
    },
    phone: {
      type: String,
      default: '+84 901 234 567',
    },
    avatarUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    },
    roles: {
      type: [String],
      default: ['ROLE_TRAVELER'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    gender: {
      type: String,
      default: 'Nam',
    },
    location: {
      type: String,
      default: 'Việt Nam',
    },
    birthDate: {
      type: String,
      default: '',
    },
    nationality: {
      type: String,
      default: 'VN',
    },
    address: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    prefLang: {
      type: String,
      default: 'en',
    },
    prefCurrency: {
      type: String,
      default: 'USD',
    },
    notifBookings: {
      type: Boolean,
      default: true,
    },
    notifMessages: {
      type: Boolean,
      default: true,
    },
    notifPromos: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model('User', userSchema);
