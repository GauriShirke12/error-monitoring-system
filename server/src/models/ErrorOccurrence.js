const mongoose = require('mongoose');

const ErrorOccurrenceSchema = new mongoose.Schema({
  errorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Error',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: Object,
    default: {}
  },
  userContext: {
    type: Object,
    default: {}
  }
});

module.exports = mongoose.model('ErrorOccurrence', ErrorOccurrenceSchema);
