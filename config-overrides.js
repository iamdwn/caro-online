module.exports = function override(config, env) {
    if (env === 'production') {
      config.plugins = [
        ...config.plugins,
        require('babel-plugin-transform-remove-console'),
        // require('babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] })
      ];
    }
    return config;
  };
  