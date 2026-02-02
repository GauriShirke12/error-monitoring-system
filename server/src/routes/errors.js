const express = require('express');
const router = express.Router();

const ErrorModel = require('../models/Error');
const generateFingerprint = require('../utils/fingerprint');
const { validationResult } = require('express-validator');
const errorValidationRules = require('../validators/errorValidator');

router.post(
  '/',
  errorValidationRules,
  async (req, res) => {
    try {
      const errors = validationResult(req);

      // Fail silently if validation fails
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

      const fingerprint = generateFingerprint(message, stackTrace);

      // Defensive: if fingerprint fails, do nothing
      if (!fingerprint) {
        return res.status(200).json({ success: true });
      }

      await ErrorModel.findOneAndUpdate(
        { fingerprint, environment },
        {
          $inc: { count: 1 },
          $set: {
            message,
            stackTrace,
            lastSeen: new Date(),
            metadata: metadata || {},
            userContext: userContext || {}
          },
          $setOnInsert: {
            firstSeen: new Date(),
            status: 'open'
          }
        },
        { upsert: true }
      );

      res.status(200).json({ success: true });
    } catch (err) {
      // Absolute silence on failure
      res.status(200).json({ success: true });
    }
  }
);

module.exports = router;
