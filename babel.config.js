const buildPresets = ({modules = false, debug = false}) => {
  return [
    '@babel/preset-react',
    [
      '@babel/preset-env',
      {
        debug,
        modules,
        targets: {
          browsers: ['chrome >= 59'],
        },
        useBuiltIns: 'usage',
      },
    ],
  ];
};

module.exports = {
  env: {
    test: {
      presets: buildPresets({debug: true, modules: 'commonjs'}),
    },
  },
  presets: buildPresets({debug: true, modules: false}),
};
