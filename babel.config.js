const buildPlugins = () => ['@babel/plugin-proposal-object-rest-spread'];

const buildPresets = ({modules = false, debug = false}) => {
  return [
    '@babel/preset-react',
    [
      '@babel/preset-env',
      {
        debug,
        modules,
        targets: {
          browsers: ['chrome >= 66'],
        },
        useBuiltIns: 'usage',
      },
    ],
  ];
};

module.exports = {
  env: {
    test: {
      plugins: buildPlugins(),
      presets: buildPresets({modules: 'commonjs'}),
    },
  },
  plugins: buildPlugins(),
  presets: buildPresets({modules: false}),
};
