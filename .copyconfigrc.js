const pkg = require('./package.json');
const path = require('path');

const contentSource = path.join(pkg.name, 'content');
const logoSource = path.join(contentSource, 'image/logo');
const macOsSource = path.join(contentSource, 'macos');
const repositoryUrl = pkg.dependencies['wire-web-config-default'];

module.exports = {
  files: {
    [path.join(logoSource, '32x32.png')]: 'resources/icons/32x32.png',
    [path.join(logoSource, '256x256.png')]: ['resources/icons/256x256.png', 'electron/img/logo.256.png'],
    [path.join(logoSource, 'logo.ico')]: 'electron/img/logo.ico',
    [path.join(macOsSource, '**')]: 'resources/macos/',
    [path.join(pkg.name, '.env.defaults')]: '.env.defaults',
  },
  repositoryUrl,
}
