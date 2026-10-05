const mongoose = require('mongoose');

const helperProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Local Guide & Explorer',
    },
    bio: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: 'Đà Nẵng & Hội An',
      index: true,
    },
    fullAddress: {
      type: String,
      default: '',
    },
    languages: {
      type: [String],
      default: ['Tiếng Việt', 'Tiếng Anh'],
    },
    skills: {
      type: [String],
      default: ['Food Tour', 'Local Culture'],
    },
    hourlyRate: {
      type: Number,
      default: 12.0,
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: true,
    },
    availabilityDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    photoGallery: {
      type: [String],
      default: [],
    },
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'BUSY', 'OFFLINE'],
      default: 'AVAILABLE',
      index: true,
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

module.exports = mongoose.model('HelperProfile', helperProfileSchema, 'helper_profiles');
