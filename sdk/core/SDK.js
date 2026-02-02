const configManager = require('./config');
const validateConfig = require('./validateConfig');

class SDK {
  constructor() {
    this.initialized = false;
    this.user = null;
    this.tags = {};
    this.breadcrumbs = [];
  }

  init(userConfig) {
    if (this.initialized) return;

    const result = validateConfig(userConfig);

    if (!result.valid) {
      console.warn('[ErrorMonitor] Invalid config:', result.reason);
      return;
    }

    configManager.set(userConfig);
    this.initialized = true;
  }

  captureError(error, context = {}) {
    const config = configManager.get();
    if (!this.initialized || !config.enabled) return;

    // Sampling
    if (Math.random() > config.sampleRate) return;

    let err;
    if (error instanceof Error) {
      err = error;
    } else {
      err = new Error(String(error));
    }

    const payload = {
      message: err.message,
      stackTrace: err.stack || '',
      environment: config.environment,
      userContext: this.user,
      tags: this.tags,
      breadcrumbs: this.breadcrumbs,
      metadata: context
    };

    // beforeSend hook
    if (config.beforeSend) {
      const result = config.beforeSend(payload);
      if (result === null) return;
    }

    // transport.send(payload) → coming next
  }

  setUser(user) {
    this.user = user;
  }

  setTag(key, value) {
    this.tags[key] = value;
  }

  addBreadcrumb(breadcrumb) {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: new Date().toISOString()
    });

    // Prevent memory leaks
    if (this.breadcrumbs.length > 20) {
      this.breadcrumbs.shift();
    }
  }
}

module.exports = SDK;
