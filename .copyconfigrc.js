//@ts-check

/** @typedef {import('@wireapp/copy-config').CopyConfigOptions} CopyConfigOptions */

const appConfigPkg = require('./app-config/package.json');

const contentSource = 'wire-desktop/content';
const imageSource = `${contentSource}/image`;
const macOsSource = `${contentSource}/macos`;

const getConfigurationEntry = () => {
  if (process.env.APP_ENV === 'wire-gov') return 'wire-web-config-wire-gov';
  if (process.env.APP_ENV === 'internal') return 'wire-web-config-internal';
  return 'wire-web-config-production';
};
const configurationEntry = getConfigurationEntry();
const repositoryUrl = appConfigPkg.dependencies[configurationEntry];

/** @type {CopyConfigOptions} */
const options = {
  files: {
    [`${imageSource}/**`]: 'electron/img/',
    [`${macOsSource}/**`]: 'resources/macos/',
    [`${imageSource}/logo/256x256.png`]: ['resources/icons/256x256.png', 'electron/img/logo.256.png', 'electron/img/logo.png'],
    [`${imageSource}/logo/32x32.png`]: 'resources/icons/32x32.png',
    [`${imageSource}/logo/logo.ico`]: 'electron/img/logo.ico',
    ['wire-desktop/.env.defaults']: '.env.defaults',
  },
  repositoryUrl,
}

module.exports = options;
