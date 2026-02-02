const mongoose = require('mongoose');

const errorSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true
    },

    stackTrace: {
      type: String,
      required: true
    },

    fingerprint: {
      type: String,
      required: true,
      index: true
    },

    count: {
      type: Number,
      default: 1
    },

    firstSeen: {
      type: Date,
      default: Date.now,
      index: true
    },

    lastSeen: {
      type: Date,
      default: Date.now
    },

    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ['open', 'resolved', 'ignored'],
      default: 'open'
    },

    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Error', errorSchema);
