// TODO: If this is part of master, sort the keys and remove the eslint-disable
/* eslint-disable sort-keys */
/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

const electronPackager = require('electron-packager');
const {createWindowsInstaller} = require('electron-winstaller');
const electronBuilder = require('electron-builder');

const ELECTRON_PACKAGE_JSON = 'electron/package.json';
const PACKAGE_JSON = 'package.json';
const INFO_JSON = 'info.json';

const LINUX_DESKTOP = {
  Version: '1.1',
  Name: 'Wire',
  GenericName: 'The most secure collaboration platform',
  Categories: 'Network;InstantMessaging;Chat;VideoConference',
  Keywords: 'chat;encrypt;e2e;messenger;videocall',
  StartupWMClass: 'Wire',
};

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt, {pattern: ['grunt-*']});

  grunt.initConfig({
    pkg: grunt.file.readJSON(PACKAGE_JSON),
    info: grunt.file.readJSON(INFO_JSON),
    buildNumber: `${process.env.BUILD_NUMBER || '0'}`,
    publish: 'never',

    clean: {
      wrap: 'wrap',
      build: 'wrap/build',
      dist: 'wrap/dist',
      win: 'wrap/**/<%= info.name %>-win*',
      macos: 'wrap/**/<%= info.name %>-darwin*',
      linux: ['wrap/**/linux*', 'wrap/**/wire*'],
      pkg: '*.pkg',
    },

    'update-keys': {
      options: {
        config: 'electron/js/config.js',
      },
    },

    productbuild: {
      options: {
        sign: {
          app: '<%= info.sign.app %>',
          package: '<%= info.sign.package %>',
        },
        parent: 'resources/macos/entitlements/parent.plist',
        child: 'resources/macos/entitlements/child.plist',
        dir: 'wrap/dist/<%= info.name %>-mas-x64/<%= info.name %>.app',
        name: '<%= info.name %>',
      },
    },

    electron: {
      options: {
        name: '<%= info.name %>',
        dir: 'electron',
        out: 'wrap/build',
        overwrite: true,
        arch: 'all',
        asar: true,
        appCopyright: '<%= info.copyright %>',
        appVersion: '<%= info.version %>',
        buildVersion: '<%= buildNumber %>',
        ignore: 'electron/renderer/src',
        protocols: [{name: '', schemes: ['wire']}],
      },

      macos_internal: {
        options: {
          name: '<%= info.nameInternal %>',
          platform: 'mas',
          icon: 'resources/macos/wire.internal.icns',
          appBundleId: 'com.wearezeta.zclient.mac.internal',
        },
      },

      macos_prod: {
        options: {
          platform: 'mas',
          out: 'wrap/dist/',
          icon: 'resources/macos/wire.icns',
          appCategoryType: 'public.app-category.social-networking',
          appBundleId: 'com.wearezeta.zclient.mac',
          helperBundleId: 'com.wearezeta.zclient.mac.helper',
          extendInfo: 'resources/macos/custom.plist',
        },
      },

      win_internal: {
        options: {
          name: '<%= info.nameInternal %>',
          platform: 'win32',
          icon: 'resources/win/wire.internal.ico',
          arch: 'ia32',
          win32metadata: {
            CompanyName: '<%= info.name %>',
            FileDescription: '<%= info.description %>',
            OriginalFilename: '<%= info.nameInternal %>.exe',
            ProductName: '<%= info.nameInternal %>',
            InternalName: '<%= info.nameInternal %>.exe',
          },
        },
      },

      win_prod: {
        options: {
          platform: 'win32',
          icon: 'resources/win/wire.ico',
          arch: 'ia32',
          win32metadata: {
            CompanyName: '<%= info.name %>',
            FileDescription: '<%= info.description %>',
            OriginalFilename: '<%= info.name %>.exe',
            ProductName: '<%= info.name %>',
            InternalName: '<%= info.name %>.exe',
          },
        },
      },
    },

    electronbuilder: {
      options: {
        asar: false,
        arch: 'all',
      },

      linux_prod: {
        options: {
          productName: 'wire-desktop',
          targets: ['deb', 'rpm', 'AppImage'],
          linux: {
            fpm: ['--name', 'wire-desktop'],
            executableName: 'wire-desktop',
            desktop: LINUX_DESKTOP,
            afterInstall: 'bin/deb/after-install.tpl',
            afterRemove: 'bin/deb/after-remove.tpl',
          },
          deb: {
            depends: ['libappindicator1', 'libasound2', 'libgconf-2-4', 'libnotify-bin', 'libnss3', 'libxss1'],
          },
          rpm: {
            depends: ['alsa-lib', 'Gconf2', 'libappindicator', 'libnotify', 'libXScrnSaver', 'libXtst', 'nss'],
          },
        },
      },

      linux_internal: {
        options: {
          productName: 'wire-desktop-internal',
          targets: ['deb', 'rpm', 'AppImage'],
          linux: {
            fpm: ['--name', 'wire-desktop-internal'],
            executableName: 'wire-desktop-internal',
            afterInstall: 'bin/deb/after-install.tpl',
            afterRemove: 'bin/deb/after-remove.tpl',
            desktop: {...LINUX_DESKTOP, Name: 'WireInternal', StartupWMClass: 'WireInternal'},
          },
          deb: {
            depends: ['libappindicator1', 'libasound2', 'libgconf-2-4', 'libnotify-bin', 'libnss3', 'libxss1'],
          },
          rpm: {
            depends: ['alsa-lib', 'Gconf2', 'libappindicator', 'libnotify', 'libXScrnSaver', 'libXtst', 'nss'],
          },
        },
      },

      linux_other: {
        options: {
          arch: `${grunt.option('arch') || process.arch}`,
          productName: 'wire-desktop',
          targets: [`${grunt.option('target') || 'dir'}`],
          linux: {
            fpm: ['--name', 'wire-desktop'],
            executableName: 'wire-desktop',
            desktop: LINUX_DESKTOP,
          },
        },
      },
    },

    'create-windows-installer': {
      internal: {
        title: '<%= info.nameInternal %>',
        description: '<%= info.description %>',
        version: '<%= info.version %>.<%= buildNumber %>',
        appDirectory: 'wrap/build/<%= info.nameInternal %>-win32-ia32',
        outputDirectory: 'wrap/internal/<%= info.nameInternal %>-win32-ia32',
        authors: '<%= info.nameInternal %>',
        exe: '<%= info.nameInternal %>.exe',
        setupIcon: 'resources/win/wire.internal.ico',
        noMsi: true,
        loadingGif: 'resources/win/icon.internal.256x256.png',
        iconUrl: 'https://wire-app.wire.com/win/internal/wire.internal.ico',
      },

      prod: {
        title: '<%= info.name %>',
        description: '<%= info.description %>',
        version: '<%= info.version %>.<%= buildNumber %>',
        appDirectory: 'wrap/build/<%= info.name %>-win32-ia32',
        outputDirectory: 'wrap/prod/<%= info.name %>-win32-ia32',
        authors: '<%= info.name %>',
        exe: '<%= info.name %>.exe',
        setupIcon: 'resources/win/wire.ico',
        noMsi: true,
        loadingGif: 'resources/win/icon.256x256.png',
        iconUrl: 'https://wire-app.wire.com/win/prod/wire.ico',
      },
    },

    gitcommit: {
      release: {
        options: {
          message: 'Bump version to <%= info.version %>',
        },
        files: {
          src: [INFO_JSON],
        },
      },
    },

    gitpush: {
      task: {
        options: {
          tags: true,
          branch: 'master',
        },
      },
    },
  });

  /**
   * Tasks
   */
  grunt.registerTask('version-inc', () => {
    const info = grunt.config.get('info');
    const {version} = info;
    const major = version.substr(0, version.indexOf('.'));
    const minor = version.substr(version.lastIndexOf('.') + 1);

    info.version = `${major}.${parseInt(minor, 10) + 1}`;
    grunt.config.set('info', info);
    grunt.file.write(INFO_JSON, `${JSON.stringify(info, null, 2)}\n`);

    const electronPkg = grunt.file.readJSON(ELECTRON_PACKAGE_JSON);
    electronPkg.version = `${info.version}`;
    grunt.file.write(ELECTRON_PACKAGE_JSON, `${JSON.stringify(electronPkg, null, 2)}\n`);

    grunt.log.write(`Version number increased to ${info.version} `).ok();
  });

  grunt.registerTask('release-internal', () => {
    const info = grunt.config.get('info');
    const buildNumber = grunt.config.get('buildNumber');
    const commitId = grunt.config('gitinfo.local.branch.current.shortSHA');
    const electronPkg = grunt.file.readJSON(ELECTRON_PACKAGE_JSON);
    electronPkg.updateWinUrl = info.updateWinUrlInternal;
    electronPkg.environment = 'internal';
    electronPkg.name = info.nameInternal.toLowerCase();
    electronPkg.productName = info.nameInternal;
    electronPkg.version =
      buildNumber === '0' ? `${info.version}.0-${commitId}-internal` : `${info.version}.${buildNumber}-internal`;
    grunt.file.write(ELECTRON_PACKAGE_JSON, `${JSON.stringify(electronPkg, null, 2)}\n`);
    grunt.log.write(`Releases URL points to ${electronPkg.updateWinUrl} `).ok();
  });

  grunt.registerTask('release-prod', () => {
    const info = grunt.config.get('info');
    const buildNumber = grunt.config.get('buildNumber');
    const commitId = grunt.config('gitinfo.local.branch.current.shortSHA');
    const electronPkg = grunt.file.readJSON(ELECTRON_PACKAGE_JSON);
    electronPkg.updateWinUrl = info.updateWinUrlProd;
    electronPkg.environment = 'production';
    electronPkg.name = info.name.toLowerCase();
    electronPkg.productName = info.name;
    electronPkg.version = buildNumber === '0' ? `${info.version}.0-${commitId}` : `${info.version}.${buildNumber}`;
    grunt.file.write(ELECTRON_PACKAGE_JSON, `${JSON.stringify(electronPkg, null, 2)}\n`);
    grunt.log.write(`Releases URL points to ${electronPkg.updateWinUrl} `).ok();
  });

  grunt.registerMultiTask('electron', 'Package Electron apps', function() {
    const done = this.async();
    electronPackager(this.options())
      .then(done)
      .catch(error => grunt.warn(error));
  });

  grunt.registerMultiTask('electronbuilder', 'Build Electron apps', function() {
    const options = this.options();
    const {targets} = options;
    delete options.targets;
    const {arch} = options;
    delete options.arch;

    const done = this.async();

    if (arch === 'all') {
      return electronBuilder
        .build({
          config: options,
          targets: electronBuilder.Platform.LINUX.createTarget(
            targets,
            electronBuilder.Arch.ia32,
            electronBuilder.Arch.x64
          ),
        })
        .then(done, done);
    }

    electronBuilder
      .build({
        config: options,
        targets: electronBuilder.Platform.LINUX.createTarget(targets, electronBuilder.archFromString(arch)),
      })
      .then(done, done);
  });

  grunt.registerTask('update-keys', function() {
    const options = this.options();
    const configString = grunt.file.read(options.config);

    if (configString) {
      const newConfigString = configString
        .replace("RAYGUN_API_KEY: ''", `RAYGUN_API_KEY: '${process.env.RAYGUN_API_KEY || ''}'`)
        .replace("GOOGLE_CLIENT_ID: ''", `GOOGLE_CLIENT_ID: '${process.env.GOOGLE_CLIENT_ID || ''}'`)
        .replace("GOOGLE_CLIENT_SECRET: ''", `GOOGLE_CLIENT_SECRET: '${process.env.GOOGLE_CLIENT_SECRET || ''}'`);
      return grunt.file.write(options.config, newConfigString);
    }

    grunt.warn('Failed updating keys in config');
  });

  grunt.registerTask('productbuild', 'Build Mac Appstore package', function() {
    const {execSync} = require('child_process');
    const options = this.options();

    [
      '/Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework',
      '/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib',
      '/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libnode.dylib',
      '/Contents/Frameworks/Electron Framework.framework/',
      `/Contents/Frameworks/${options.name} Helper.app/Contents/MacOS/${options.name} Helper`,
      `/Contents/Frameworks/${options.name} Helper.app/`,
      `/Contents/Frameworks/${options.name} Helper EH.app/Contents/MacOS/${options.name} Helper EH`,
      `/Contents/Frameworks/${options.name} Helper EH.app/`,
      `/Contents/Frameworks/${options.name} Helper NP.app/Contents/MacOS/${options.name} Helper NP`,
      `/Contents/Frameworks/${options.name} Helper NP.app/`,
    ].forEach(file =>
      execSync(`codesign --deep -fs '${options.sign.app}' --entitlements '${options.child}' '${options.dir}${file}'`)
    );

    execSync(
      `codesign -fs '${options.sign.app}' --entitlements '${options.child}' '${options.dir}/Contents/MacOS/${
        options.name
      }'`
    );
    execSync(`codesign -fs '${options.sign.app}' --entitlements '${options.parent}' '${options.dir}'`);
    execSync(
      `productbuild --component '${options.dir}' /Applications --sign '${options.sign.package}' '${options.name}.pkg'`
    );
  });

  grunt.registerMultiTask('create-windows-installer', 'Create the Windows installer', function() {
    this.requiresConfig(`${this.name}.${this.target}.appDirectory`);

    const config = grunt.config(`${this.name}.${this.target}`);
    const done = this.async();
    createWindowsInstaller(config).then(done, done);
  });

  grunt.registerTask('bundle', 'Bundle React app', () => {
    const {execSync} = require('child_process');
    execSync('npm run bundle');
  });

  grunt.registerTask('bump-version', ['version-inc', 'gitcommit', 'gitpush']);

  grunt.registerTask('macos', [
    'clean:macos',
    'update-keys',
    'gitinfo',
    'release-internal',
    'bundle',
    'electron:macos_internal',
  ]);

  grunt.registerTask('macos-prod', [
    'clean:macos',
    'update-keys',
    'gitinfo',
    'release-prod',
    'bundle',
    'electron:macos_prod',
    'productbuild',
  ]);

  grunt.registerTask('win', [
    'clean:win',
    'update-keys',
    'gitinfo',
    'release-internal',
    'bundle',
    'electron:win_internal',
    'create-windows-installer:internal',
  ]);

  grunt.registerTask('win-prod', [
    'clean:win',
    'update-keys',
    'gitinfo',
    'release-prod',
    'bundle',
    'electron:win_prod',
    'create-windows-installer:prod',
  ]);

  grunt.registerTask('linux', [
    'clean:linux',
    'update-keys',
    'gitinfo',
    'release-internal',
    'bundle',
    'electronbuilder:linux_internal',
  ]);

  grunt.registerTask('linux-prod', [
    'clean:linux',
    'update-keys',
    'gitinfo',
    'release-prod',
    'bundle',
    'electronbuilder:linux_prod',
  ]);

  grunt.registerTask('linux-other-internal', [
    'clean:linux',
    'update-keys',
    'gitinfo',
    'release-internal',
    'bundle',
    'electronbuilder:linux_other',
  ]);

  grunt.registerTask('linux-other', [
    'clean:linux',
    'update-keys',
    'gitinfo',
    'release-prod',
    'bundle',
    'electronbuilder:linux_other',
  ]);
};
