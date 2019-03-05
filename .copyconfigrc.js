const pkg = require('./package.json');
const path = require('path');

const imageSource = path.join(pkg.name, 'content/image');
const macOsSource = path.join(contentSource, 'macos');

const configurationEntry = `wire-web-config-default-${process.env.BUILD_ENV !== 'internal' ? 'production' : 'internal'}`;
const repositoryUrl = pkg.dependencies[configurationEntry];

module.exports = {
  files: {
    [`${imageSource}/**`]: 'electron/img/',
    [`${macOsSource}/**`]: 'resources/macos/',
    [`${imageSource}/logo/256x256.png`]: 'resources/icons/256x256.png',
    [`${pkg.name}/.env.defaults`]: '.env.defaults',
  },
  repositoryUrl,
}
