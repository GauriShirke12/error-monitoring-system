const stripHtml = (text = '') => {
  return text.replace(/<\/?[^>]+(>|$)/g, '');
};

const sensitivePatterns = [
  {
    regex: /\b\d{13,19}\b/g,
    replacement: '[REDACTED_CREDIT_CARD]'
  },
  {
    regex: /password\s*=\s*[^&\s]+/gi,
    replacement: 'password=[REDACTED]'
  },
  {
    regex: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
    replacement: 'Bearer [REDACTED_TOKEN]'
  }
];

const maskSensitiveData = (text = '') => {
  let sanitized = text;

  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern.regex, pattern.replacement);
  });

  return sanitized;
};

module.exports = {
  stripHtml,
  maskSensitiveData
};

const sanitizeText = (text = '') => {
  const noHtml = stripHtml(text);
  return maskSensitiveData(noHtml);
};

module.exports = {
  stripHtml,
  maskSensitiveData,
  sanitizeText
};
