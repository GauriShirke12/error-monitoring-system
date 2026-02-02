const DEFAULT_CONFIG = {
  environment: 'production',
  enabled: true,
  sampleRate: 1.0,
  beforeSend: null
};

class ConfigManager {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  set(userConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...userConfig
    };
  }

  get() {
    return this.config;
  }
}

module.exports = new ConfigManager();
