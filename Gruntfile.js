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

const {createWindowsInstaller} = require('electron-winstaller');
const electronPackager = require('electron-packager');
const electronBuilder = require('electron-builder');

const ELECTRON_PACKAGE_JSON = 'electron/package.json';
const INFO_JSON = 'info.json';
const PACKAGE_JSON = 'package.json';

const LINUX_DESKTOP = {
  Categories: 'Network;InstantMessaging;Chat;VideoConference',
  GenericName: '<%= info.description %>',
  Keywords: 'chat;encrypt;e2e;messenger;videocall',
  Name: '<%= info.name %>',
  StartupWMClass: '<%= info.name %>',
  Version: '1.1',
};

const LINUX_SETTINGS = {
  afterInstall: 'bin/deb/after-install.tpl',
  afterRemove: 'bin/deb/after-remove.tpl',
  category: 'Network',
  desktop: LINUX_DESKTOP,
  fpm: ['--name', 'wire-desktop'],
};

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt, {pattern: ['grunt-*']});

  grunt.initConfig({
    appBase: process.env.APP_BASE || 'https://app.wire.com',
    buildNumber: process.env.BUILD_NUMBER || '0',

    clean: {
      build: 'wrap/build',
      dist: 'wrap/dist',
      linux: ['wrap/**/linux*', 'wrap/**/wire*'],
      macos: 'wrap/**/<%= info.name %>-darwin*',
      pkg: '*.pkg',
      win: 'wrap/**/<%= info.name %>-win*',
      wrap: 'wrap',
    },

    'create-windows-installer': {
      beta: {
        appDirectory: 'wrap/build/<%= info.nameBeta %>-win32-ia32',
        authors: '<%= info.nameBeta %>',
        description: '<%= info.description %>',
        exe: '<%= info.nameBeta %>.exe',
        iconUrl: 'https://wire-app.wire.com/win/prod/wire.ico',
        loadingGif: 'resources/win/icon.internal.256x256.png',
        noMsi: true,
        outputDirectory: 'wrap/beta/<%= info.nameBeta %>-win32-ia32',
        setupIcon: 'resources/win/wire.ico',
        title: '<%= info.nameBeta %>',
        version: '<%= info.version %>.<%= buildNumber %>',
      },

      internal: {
        appDirectory: 'wrap/build/<%= info.nameInternal %>-win32-ia32',
        authors: '<%= info.nameInternal %>',
        description: '<%= info.description %>',
        exe: '<%= info.nameInternal %>.exe',
        iconUrl: 'https://wire-app.wire.com/win/internal/wire.internal.ico',
        loadingGif: 'resources/win/icon.internal.256x256.png',
        noMsi: true,
        outputDirectory: 'wrap/internal/<%= info.nameInternal %>-win32-ia32',
        setupIcon: 'resources/win/wire.internal.ico',
        title: '<%= info.nameInternal %>',
        version: '<%= info.version %>.<%= buildNumber %>',
      },

      prod: {
        appDirectory: 'wrap/build/<%= info.name %>-win32-ia32',
        authors: '<%= info.name %>',
        description: '<%= info.description %>',
        exe: '<%= info.name %>.exe',
        iconUrl: 'https://wire-app.wire.com/win/prod/wire.ico',
        loadingGif: 'resources/win/icon.256x256.png',
        noMsi: true,
        outputDirectory: 'wrap/prod/<%= info.name %>-win32-ia32',
        setupIcon: 'resources/win/wire.ico',
        title: '<%= info.name %>',
        version: '<%= info.version %>.<%= buildNumber %>',
      },
    },

    electron: {
      macos_internal: {
        options: {
          appBundleId: 'com.wearezeta.zclient.mac.internal',
          icon: 'resources/macos/wire.internal.icns',
          name: '<%= info.nameInternal %>',
          platform: 'mas',
        },
      },

      macos_prod: {
        options: {
          appBundleId: 'com.wearezeta.zclient.mac',
          appCategoryType: 'public.app-category.social-networking',
          extendInfo: 'resources/macos/custom.plist',
          helperBundleId: 'com.wearezeta.zclient.mac.helper',
          icon: 'resources/macos/wire.icns',
          out: 'wrap/dist/',
          platform: 'mas',
        },
      },

      options: {
        appCopyright: '<%= info.copyright %>',
        appVersion: '<%= info.version %>',
        arch: 'all',
        asar: true,
        buildVersion: '<%= buildNumber %>',
        dir: 'electron',
        ignore: 'electron/renderer/src',
        name: '<%= info.name %>',
        out: 'wrap/build',
        overwrite: true,
        protocols: [{name: '', schemes: ['wire']}],
      },

      win_beta: {
        options: {
          arch: 'ia32',
          icon: 'resources/win/wire.ico',
          name: '<%= info.nameBeta %>',
          platform: 'win32',
          win32metadata: {
            CompanyName: '<%= info.name %>',
            FileDescription: '<%= info.description %>',
            InternalName: '<%= info.nameBeta %>.exe',
            OriginalFilename: '<%= info.nameBeta %>.exe',
            ProductName: '<%= info.nameBeta %>',
          },
        },
      },

      win_internal: {
        options: {
          arch: 'ia32',
          icon: 'resources/win/wire.internal.ico',
          name: '<%= info.nameInternal %>',
          platform: 'win32',
          win32metadata: {
            CompanyName: '<%= info.name %>',
            FileDescription: '<%= info.description %>',
            InternalName: '<%= info.nameInternal %>.exe',
            OriginalFilename: '<%= info.nameInternal %>.exe',
            ProductName: '<%= info.nameInternal %>',
          },
        },
      },

      win_prod: {
        options: {
          arch: 'ia32',
          icon: 'resources/win/wire.ico',
          platform: 'win32',
          win32metadata: {
            CompanyName: '<%= info.name %>',
            FileDescription: '<%= info.description %>',
            InternalName: '<%= info.name %>.exe',
            OriginalFilename: '<%= info.name %>.exe',
            ProductName: '<%= info.name %>',
          },
        },
      },
    },

    electronbuilder: {
      linux_internal: {
        options: {
          deb: {
            ...LINUX_SETTINGS,
            depends: ['libappindicator1', 'libasound2', 'libgconf-2-4', 'libnotify-bin', 'libnss3', 'libxss1'],
            desktop: {
              ...LINUX_DESKTOP,
              Name: '<%= info.nameInternal %>',
            },
            fpm: ['--name', 'wire-desktop-internal'],
          },
          linux: {
            category: LINUX_SETTINGS.category,
            executableName: 'wire-desktop-internal',
          },
          rpm: {
            ...LINUX_SETTINGS,
            depends: ['alsa-lib', 'GConf2', 'libappindicator', 'libnotify', 'libXScrnSaver', 'libXtst', 'nss'],
            fpm: ['--name', 'wire-desktop-internal'],
          },
          targets: ['deb', 'rpm', 'AppImage'],
        },
      },

      linux_other: {
        options: {
          arch: grunt.option('arch') || process.arch,
          linux: {
            category: LINUX_SETTINGS.category,
            desktop: LINUX_DESKTOP,
            executableName: 'wire-desktop',
          },
          productName: 'wire-desktop',
          targets: [grunt.option('target') || 'dir'],
        },
      },

      linux_prod: {
        options: {
          deb: {
            ...LINUX_SETTINGS,
            depends: ['libappindicator1', 'libasound2', 'libgconf-2-4', 'libnotify-bin', 'libnss3', 'libxss1'],
          },
          linux: {
            category: LINUX_SETTINGS.category,
            executableName: 'wire-desktop',
          },
          rpm: {
            ...LINUX_SETTINGS,
            depends: ['alsa-lib', 'GConf2', 'libappindicator', 'libnotify', 'libXScrnSaver', 'libXtst', 'nss'],
          },
          targets: ['deb', 'rpm', 'AppImage'],
        },
      },

      options: {
        arch: 'all',
        asar: false,
        publish: null,
      },
    },

    gitcommit: {
      release: {
        files: {
          src: [INFO_JSON],
        },
        options: {
          message: 'Bump version to <%= info.version %>',
        },
      },
    },

    gitpush: {
      task: {
        options: {
          branch: 'master',
          tags: true,
        },
      },
    },

    info: grunt.file.readJSON(INFO_JSON),

    pkg: grunt.file.readJSON(PACKAGE_JSON),

    productbuild: {
      options: {
        child: 'resources/macos/entitlements/child.plist',
        dir: 'wrap/dist/<%= info.name %>-mas-x64/<%= info.name %>.app',
        name: '<%= info.name %>',
        parent: 'resources/macos/entitlements/parent.plist',
        sign: {
          app: '<%= info.sign.app %>',
          package: '<%= info.sign.package %>',
        },
      },
    },

    'update-keys': {
      options: {
        config: 'electron/dist/js/config.js',
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

    grunt.log.write(`Version number increased to "${info.version}". `).ok();
  });

  grunt.registerTask('set-webapp-base', () => {
    const APP_BASE = grunt.config.get('appBase');

    const electronPkg = grunt.file.readJSON(ELECTRON_PACKAGE_JSON);
    electronPkg.appBase = APP_BASE;
    grunt.file.write(ELECTRON_PACKAGE_JSON, `${JSON.stringify(electronPkg, null, 2)}\n`);

    grunt.log.write(`Webapp base set to "${APP_BASE}". `).ok();
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
    grunt.log.write(`Releases URL points to "${electronPkg.updateWinUrl}". `).ok();
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
    grunt.log.write(`Releases URL points to "${electronPkg.updateWinUrl}". `).ok();
  });

  grunt.registerTask('release-beta', () => {
    const info = grunt.config.get('info');
    const buildNumber = grunt.config.get('buildNumber');
    const commitId = grunt.config('gitinfo.local.branch.current.shortSHA');
    const electronPkg = grunt.file.readJSON(ELECTRON_PACKAGE_JSON);
    electronPkg.updateWinUrl = info.updateWinUrlBeta;
    electronPkg.environment = 'internal';
    electronPkg.name = info.nameInternal.toLowerCase();
    electronPkg.productName = info.nameBeta;
    electronPkg.version =
      buildNumber === '0' ? `${info.version}.0-${commitId}-beta` : `${info.version}.${buildNumber}-beta`;
    grunt.file.write(ELECTRON_PACKAGE_JSON, `${JSON.stringify(electronPkg, null, 2)}\n`);
    grunt.log.write(`Releases URL points to "${electronPkg.updateWinUrl}". `).ok();
  });

  grunt.registerMultiTask('electron', 'Package Electron apps', function() {
    const done = this.async();
    electronPackager(this.options())
      .then(done)
      .catch(error => grunt.warn(error));
  });

  grunt.registerMultiTask('electronbuilder', 'Build Electron apps', function() {
    const options = this.options();
    const {arch, targets} = options;
    delete options.targets;
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
      const newConfigString = configString.replace(
        "RAYGUN_API_KEY: ''",
        `RAYGUN_API_KEY: '${process.env.RAYGUN_API_KEY || ''}'`
      );
      return grunt.file.write(options.config, newConfigString);
    }

    grunt.warn('Failed updating keys in config');
  });

  grunt.registerTask('productbuild', 'Build Mac Appstore package', function() {
    const {execSync} = require('child_process');
    const options = this.options();

    [
      '/Frameworks/Electron Framework.framework/Versions/A/Electron Framework',
      '/Frameworks/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib',
      '/Frameworks/Electron Framework.framework/',
      `/Frameworks/${options.name} Helper.app/Contents/MacOS/${options.name} Helper`,
      `/Frameworks/${options.name} Helper.app/`,
      `/Library/LoginItems/${options.name} Login Helper.app/Contents/MacOS/${options.name} Login Helper`,
      `/Library/LoginItems/${options.name} Login Helper.app/`,
    ].forEach(file => {
      const fileName = `${options.dir}/Contents${file}`;
      execSync(`codesign --deep -fs '${options.sign.app}' --entitlements '${options.child}' '${fileName}'`);
    });

    const appName = `${options.dir}/Contents/MacOS/${options.name}`;
    execSync(`codesign -fs '${options.sign.app}' --entitlements '${options.child}' '${appName}'`);
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
    execSync('yarn bundle');
  });

  grunt.registerTask('bump-version', ['version-inc', 'gitcommit', 'gitpush']);

  grunt.registerTask('macos', [
    'clean:macos',
    'update-keys',
    'gitinfo',
    'set-webapp-base',
    'release-internal',
    'bundle',
    'electron:macos_internal',
  ]);

  grunt.registerTask('macos-prod', [
    'clean:macos',
    'update-keys',
    'gitinfo',
    'set-webapp-base',
    'release-prod',
    'bundle',
    'electron:macos_prod',
    'productbuild',
  ]);

  grunt.registerTask('win', [
    'clean:win',
    'update-keys',
    'gitinfo',
    'set-webapp-base',
    'release-internal',
    'bundle',
    'electron:win_internal',
    'create-windows-installer:internal',
  ]);

  grunt.registerTask('win-prod', [
    'clean:win',
    'update-keys',
    'gitinfo',
    'set-webapp-base',
    'release-prod',
    'bundle',
    'electron:win_prod',
    'create-windows-installer:prod',
  ]);

  grunt.registerTask('win-beta', [
    'clean:win',
    'update-keys',
    'gitinfo',
    'set-webapp-base',
    'release-beta',
    'bundle',
    'electron:win_beta',
    'create-windows-installer:beta',
  ]);

  grunt.registerTask('linux', [
    'clean:linux',
    'update-keys',
    'gitinfo',
    'set-webapp-base',
    'release-internal',
    'bundle',
    'electronbuilder:linux_internal',
  ]);

  grunt.registerTask('linux-prod', [
    'clean:linux',
    'update-keys',
    'gitinfo',
    'set-webapp-base',
    'release-prod',
    'bundle',
    'electronbuilder:linux_prod',
  ]);

  grunt.registerTask('linux-other-internal', [
    'clean:linux',
    'update-keys',
    'gitinfo',
    'set-webapp-base',
    'release-internal',
    'bundle',
    'electronbuilder:linux_other',
  ]);

  grunt.registerTask('linux-other', [
    'clean:linux',
    'update-keys',
    'gitinfo',
    'set-webapp-base',
    'release-prod',
    'bundle',
    'electronbuilder:linux_other',
  ]);
};
