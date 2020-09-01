// @ts-check
/* eslint-disable valid-jsdoc */

const plugins = ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-optional-chaining'];

/**
 * @param {{debug?: boolean, modules?: false | string}} options
 * @typedef {import('@babel/core').PluginItem} PluginItem
 * @returns {PluginItem[]}
 */
const buildPresets = ({debug = false, modules = false}) => {
  /** @type {PluginItem} */
  const browserEnvPreset = [
    '@babel/preset-env',
    {
      corejs: '3',
      debug,
      modules,
      targets: {
        browsers: ['chrome >= 78'],
      },
      useBuiltIns: 'usage',
    },
  ];

  return ['@babel/preset-react', '@babel/preset-typescript', browserEnvPreset];
};

/** @type {import('@babel/core').TransformOptions} */
const config = {
  env: {
    test: {
      plugins,
      presets: buildPresets({modules: 'commonjs'}),
    },
  },
  plugins,
  presets: buildPresets({modules: false}),
};

module.exports = config;
