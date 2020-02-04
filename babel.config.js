const plugins = ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-optional-chaining'];

// TODO: Import presets from ".babel-register.js"
const buildPresets = ({modules = false, debug = false}) => {
  return [
    '@babel/preset-react',
    [
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
    ],
    '@babel/preset-typescript',
  ];
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
