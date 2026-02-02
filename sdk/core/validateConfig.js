module.exports = function validateConfig(config) {
  if (!config) {
    throw new Error('SDK config is required');
  }

  if (!config.dsn) {
    throw new Error('dsn is required');
  }

  if (!config.environment) {
    throw new Error('environment is required');
  }
};
module.exports = function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    return { valid: false, reason: 'Config must be an object' };
  }

  if (!config.apiKey) {
    return { valid: false, reason: 'apiKey is required' };
  }

  if (!config.apiUrl) {
    return { valid: false, reason: 'apiUrl is required' };
  }

  if (
    config.sampleRate !== undefined &&
    (config.sampleRate < 0 || config.sampleRate > 1)
  ) {
    return { valid: false, reason: 'sampleRate must be between 0 and 1' };
  }

  if (
    config.beforeSend &&
    typeof config.beforeSend !== 'function'
  ) {
    return { valid: false, reason: 'beforeSend must be a function' };
  }

  return { valid: true };
};
