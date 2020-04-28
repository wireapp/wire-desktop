const plugins = ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-optional-chaining'];

const buildPresets = ({debug = false, modules = false}) => {
  const browserEnvPreset = [
    '@babel/preset-env',
    {
      corejs: '2',
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

module.exports = {
  env: {
    test: {
      plugins,
      presets: buildPresets({modules: 'commonjs'}),
    },
  },
  plugins,
  presets: buildPresets({modules: false}),
};
