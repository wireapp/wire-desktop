const plugins = [
  '@babel/plugin-proposal-class-properties',
  '@babel/plugin-proposal-object-rest-spread',
  '@babel/plugin-proposal-optional-chaining',
];

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
      plugins,
      presets: buildPresets({modules: 'commonjs'}),
    },
  },
  plugins,
  presets: buildPresets({modules: false}),
};
