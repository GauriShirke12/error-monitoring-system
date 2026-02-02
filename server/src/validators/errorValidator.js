const { body } = require('express-validator');

const errorValidationRules = [
  body('message')
    .isString()
    .notEmpty(),

  body('stackTrace')
    .isString()
    .notEmpty(),

  body('environment')
    .isString()
    .notEmpty(),

  body('userContext')
    .optional()
    .isObject(),

  body('metadata')
    .optional()
    .isObject()
];

module.exports = errorValidationRules;
