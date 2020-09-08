const babelRegister = require('@babel/register');

const nodeEnvPreset = [
  '@babel/preset-env',
  {
    targets: {
      node: 'current',
    },
  },
];

const registerOptions = {
  cache: false,
  extensions: ['.ts'],
  plugins: [
    '@babel/proposal-class-properties',
    [
      'istanbul',
      {
        exclude: ['**/*.test*.ts'],
      },
    ],
  ],
  presets: [
    '@babel/preset-typescript',
    nodeEnvPreset,
  ],
}

babelRegister(registerOptions);
