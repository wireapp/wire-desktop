const pkg = require('./package.json');
const path = require('path');

const contentSource = path.join(pkg.name, 'content');
const logoSource = path.join(contentSource, 'image/logo');
const macOsSource = path.join(contentSource, 'macos');

const configurationEntry = `wire-web-config-default-${process.env.BUILD_ENV !== 'internal' ? 'production' : 'internal'}`;
const repositoryUrl = pkg.dependencies[configurationEntry];

module.exports = {
  files: {
    [`${logoSource}/32x32.png`]: 'resources/icons/32x32.png',
    [`${logoSource}/256x256.png`]: ['resources/icons/256x256.png', 'electron/img/logo.256.png'],
    [`${logoSource}/logo.ico`]: 'electron/img/logo.ico',
    [`${macOsSource}/**`]: 'resources/macos/',
    [`${pkg.name}/.env.defaults`]: '.env.defaults',
  },
  repositoryUrl,
}
