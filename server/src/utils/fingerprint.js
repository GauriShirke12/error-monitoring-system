const crypto = require('crypto');

const generateFingerprint = (message, stackTrace) => {
  if (!message || !stackTrace) return null;

  const stackLines = stackTrace
    .split('\n')
    .slice(0, 3)
    .join('|');

  const rawFingerprint = `${message}|${stackLines}`;

  return crypto
    .createHash('md5')
    .update(rawFingerprint)
    .digest('hex');
};

module.exports = generateFingerprint;
