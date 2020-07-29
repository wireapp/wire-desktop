//@ts-check

/** @typedef {import('@wireapp/copy-config').CopyConfigOptions} CopyConfigOptions */

const appConfigPkg = require('./app-config/package.json');

const contentSource = 'wire-desktop/content';
const imageSource = `${contentSource}/image`;
const macOsSource = `${contentSource}/macos`;

const configurationEntry = `wire-web-config-${process.env.APP_ENV !== 'internal' ? 'production' : 'internal'}`;
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
