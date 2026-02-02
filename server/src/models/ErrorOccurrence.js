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

function getStartDate(range) {
  const now = new Date();

  if (range === '24h') {
    return new Date(now - 24 * 60 * 60 * 1000);
  }
  if (range === '7d') {
    return new Date(now - 7 * 24 * 60 * 60 * 1000);
  }
  if (range === '30d') {
    return new Date(now - 30 * 24 * 60 * 60 * 1000);
  }

  // default
  return new Date(now - 7 * 24 * 60 * 60 * 1000);
}
function getDateFormat(groupBy) {
  if (groupBy === 'hour') return '%Y-%m-%d %H:00';
  if (groupBy === 'day') return '%Y-%m-%d';
  if (groupBy === 'week') return '%Y-%U';
  return '%Y-%m-%d';
}


module.exports = mongoose.model('ErrorOccurrence', ErrorOccurrenceSchema);
