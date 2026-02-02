const express = require('express');
const router = express.Router();

const ErrorModel = require('../models/Error');
const ErrorOccurrence = require('../models/ErrorOccurrence');

const generateFingerprint = require('../utils/fingerprint');
const { sanitizeText } = require('../utils/sanitize');
const logger = require('../utils/logger');

const { validationResult } = require('express-validator');
const errorValidationRules = require('../validators/errorValidator');

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

module.exports = router;
