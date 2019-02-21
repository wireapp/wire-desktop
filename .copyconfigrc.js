const pkg = require('./package.json');
const path = require('path');

const logoSource = path.join(pkg.name, 'content/image/logo');
const repositoryUrl = pkg.dependencies['wire-web-config-default'];

module.exports = {
  files: {
    [path.join(logoSource, '32x32.png')]: 'resources/icons/32x32.png',
    [path.join(logoSource, '256x256.png')]: ['resources/icons/256x256.png', 'electron/img/wire.256.png'],
    [path.join(logoSource, 'wire.icns')]: 'resources/macos/wire.icns',
    [path.join(logoSource, 'wire.ico')]: 'electron/img/wire.ico',
  },
  repositoryUrl,
}
