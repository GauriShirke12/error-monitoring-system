const express = require('express');
const router = express.Router();

const ErrorModel = require('../models/Error');
const ErrorOccurrence = require('../models/ErrorOccurrence');

const generateFingerprint = require('../utils/fingerprint');
const { sanitizeText } = require('../utils/sanitize');
const logger = require('../utils/logger');

const { validationResult } = require('express-validator');
const errorValidationRules = require('../validators/errorValidator');


// routes/errors.js
router.post('/', validateError, ingestError);

router.post(
  '/',
  errorValidationRules,
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: true });
    }

    const {
      message,
      stackTrace,
      environment,
      userContext,
      metadata
    } = req.body;

    try {
      //Sanitize inputs
      const cleanMessage = sanitizeText(message);
      const cleanStackTrace = sanitizeText(stackTrace);

      // Generate fingerprint
      const fingerprint = generateFingerprint(cleanMessage, cleanStackTrace);
      if (!fingerprint) {
        return res.status(200).json({ success: true });
      }

      //Group error
      const errorGroup = await ErrorModel.findOneAndUpdate(
        { fingerprint, environment },
        {
          $inc: { count: 1 },
          $set: {
            message: cleanMessage,
            stackTrace: cleanStackTrace,
            lastSeen: new Date(),
            metadata: metadata || {},
            userContext: userContext || {}
          },
          $setOnInsert: {
            firstSeen: new Date(),
            status: 'open'
          }
        },
        { upsert: true, new: true }
      );

      // Store occurrence
      await ErrorOccurrence.create({
        errorId: errorGroup._id,
        metadata: metadata || {},
        userContext: userContext || {}
      });

      // Success (silent)
      return res.status(200).json({ success: true });

    } catch (err) {
      // Defensive failure handling
      logger.error({
        message: 'Error ingestion failed',
        error: err.message,
        stack: err.stack,
        environment
      });

      // Client must never fail
      return res.status(202).json({ accepted: true });
    }
  }
);

router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      environment,
      status,
      sortBy = 'count',
      sortOrder = 'desc'
    } = req.query;

    const filters = {};
    if (environment) filters.environment = environment;
    if (status) filters.status = status;

    const allowedSortFields = ['count', 'lastSeen', 'firstSeen'];

const safeSortBy = allowedSortFields.includes(sortBy)
  ? sortBy
  : 'count';

const sort = {
  [safeSortBy]: sortOrder === 'asc' ? 1 : -1
};

    const skip = (page - 1) * limit;

    const errors = await ErrorModel.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select('message environment count status firstSeen lastSeen')
      .lean();

    const total = await ErrorModel.countDocuments(filters);

    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      results: errors
    });

  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch errors' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const error = await ErrorModel.findById(id).lean();
    if (!error) {
      return res.status(404).json({ message: 'Error not found' });
    }

    const occurrences = await ErrorOccurrence.find({ errorId: id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      error,
      occurrences
    });

  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch error details' });
  }
});



router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['open', 'resolved', 'ignored'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const error = await ErrorModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();

    if (!error) {
      return res.status(404).json({ message: 'Error not found' });
    }

    res.json({ success: true, error });

  } catch (err) {
    res.status(500).json({ message: 'Failed to update status' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const error = await ErrorModel.findByIdAndDelete(id);
    if (!error) {
      return res.status(404).json({ message: 'Error not found' });
    }

    await ErrorOccurrence.deleteMany({ errorId: id });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: 'Failed to delete error' });
  }
});

if (status) {
  filters.status = status;
} else {
  filters.status = 'open';
}


module.exports = router;
