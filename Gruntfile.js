/* eslint-disable sort-keys */
/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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

const electron_packager = require('electron-packager');
const {createWindowsInstaller} = require('electron-winstaller');
const electron_builder = require('electron-builder');

const ELECTRON_PACKAGE_JSON = 'electron/package.json';
const PACKAGE_JSON = 'package.json';
const INFO_JSON = 'info.json';

const LINUX_DESKTOP = {
  "Version": "1.1",
  "Name": "Wire",
  "GenericName": "Secure messenger",
  "Categories": "Network;InstantMessaging;Chat;VideoConference",
  "Keywords": "chat;encrypt;e2e;messenger;videocall",
  "StartupWMClass": "Wire"
};

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt, {pattern: ['grunt-*']});

  grunt.initConfig({
    pkg: grunt.file.readJSON(PACKAGE_JSON),
    info: grunt.file.readJSON(INFO_JSON),
    build_number: `${process.env.BUILD_NUMBER || '0'}`,

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
        buildVersion: '<%= build_number %>',
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
          targets: ['deb', 'AppImage'],
          linux: {
            fpm: ['--name', 'wire-desktop'],
            executableName: 'wire-desktop',
            afterInstall: 'bin/deb/after-install.tpl',
            afterRemove: 'bin/deb/after-remove.tpl',
            desktop: LINUX_DESKTOP,
            depends: ['libappindicator1', 'libasound2', 'libgconf-2-4', 'libnotify-bin', 'libnss3', 'libxss1'],
          },
        },
      },

      linux_internal: {
        options: {
          productName: 'wire-desktop-internal',
          targets: ['deb', 'AppImage'],
          linux: {
            fpm: ['--name', 'wire-desktop-internal'],
            executableName: 'wire-desktop-internal',
            afterInstall: 'bin/deb/after-install.tpl',
            afterRemove: 'bin/deb/after-remove.tpl',
            desktop: LINUX_DESKTOP,
            depends: ['libappindicator1', 'libasound2', 'libgconf-2-4', 'libnotify-bin', 'libnss3', 'libxss1'],
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
        version: '<%= info.version %>.<%= build_number %>',
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
        version: '<%= info.version %>.<%= build_number %>',
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

    githubChanges: {
      release: {
        options: {
          auth: true,
          onlyPulls: true,
          useCommitBody: true,
          owner: 'wireapp',
          repository: 'wire-desktop',
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

    const electron_pkg = grunt.file.readJSON(ELECTRON_PACKAGE_JSON);
    electron_pkg.version = `${info.version}`;
    grunt.file.write(ELECTRON_PACKAGE_JSON, `${JSON.stringify(electron_pkg, null, 2)}\n`);

    grunt.log.write(`Version number increased to ${info.version} `).ok();
  });

  grunt.registerTask('release-internal', () => {
    const info = grunt.config.get('info');
    const build_number = grunt.config.get('build_number');
    const commit_id = grunt.config('gitinfo.local.branch.current.shortSHA');
    const electron_pkg = grunt.file.readJSON(ELECTRON_PACKAGE_JSON);
    electron_pkg.updateWinUrl = info.updateWinUrlInternal;
    electron_pkg.environment = 'internal';
    electron_pkg.name = info.nameInternal.toLowerCase();
    electron_pkg.productName = info.nameInternal;
    electron_pkg.version = build_number === '0'
      ? `${info.version}.0-${commit_id}-internal`
      : `${info.version}.${build_number}-internal`;
    grunt.file.write(ELECTRON_PACKAGE_JSON, `${JSON.stringify(electron_pkg, null, 2)}\n`);
    grunt.log.write(`Releases URL points to ${electron_pkg.updateWinUrl} `).ok();
  });

  grunt.registerTask('release-prod', () => {
    const info = grunt.config.get('info');
    const build_number = grunt.config.get('build_number');
    const commit_id = grunt.config('gitinfo.local.branch.current.shortSHA');
    const electron_pkg = grunt.file.readJSON(ELECTRON_PACKAGE_JSON);
    electron_pkg.updateWinUrl = info.updateWinUrlProd;
    electron_pkg.environment = 'production';
    electron_pkg.name = info.name.toLowerCase();
    electron_pkg.productName = info.name;
    if (build_number === '0') {
      electron_pkg.version = `${info.version}.0-${commit_id}`;
    } else {
      electron_pkg.version = `${info.version}.${build_number}`;
    }
    grunt.file.write(ELECTRON_PACKAGE_JSON, `${JSON.stringify(electron_pkg, null, 2)}\n`);
    grunt.log.write(`Releases URL points to ${electron_pkg.updateWinUrl} `).ok();
  });

  grunt.registerMultiTask('electron', 'Package Electron apps', function() {
    const done = this.async();
    electron_packager(this.options(), function(error) {
      if (error) {
        return grunt.warn(error);
      }
      done();
    });
  });

  grunt.registerMultiTask('electronbuilder', 'Build Electron apps', function() {
    const options = this.options();
    const {targets} = options;
    delete options.targets;
    const {arch} = options;
    delete options.arch;

    if (arch === 'all') {
      return electron_builder.build({
        targets: electron_builder.Platform.LINUX.createTarget(
          targets,
          electron_builder.Arch.ia32,
          electron_builder.Arch.x64,
        ),
        config: options,
      });
    }

    electron_builder.build({
      targets: electron_builder.Platform.LINUX.createTarget(targets, electron_builder.archFromString(arch)),
      config: options,
    });
  });

  grunt.registerTask('update-keys', function() {
    const options = this.options();
    const config_string = grunt.file.read(options.config);

    if (config_string) {
      const new_config_string = config_string
        .replace("RAYGUN_API_KEY: ''", `RAYGUN_API_KEY: '${process.env.RAYGUN_API_KEY || ''}'`)
        .replace("GOOGLE_CLIENT_ID: ''", `GOOGLE_CLIENT_ID: '${process.env.GOOGLE_CLIENT_ID || ''}'`)
        .replace("GOOGLE_CLIENT_SECRET: ''", `GOOGLE_CLIENT_SECRET: '${process.env.GOOGLE_CLIENT_SECRET || ''}'`);
      return grunt.file.write(options.config, new_config_string);
    }

    grunt.warn('Failed updating keys in config');
  });

  grunt.registerTask('productbuild', 'Build Mac Appstore package', function() {
    const {execSync} = require('child_process');
    const options = this.options();

    [
      'Electron Framework.framework/Versions/A/Electron Framework',
      'Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib',
      'Electron Framework.framework/Versions/A/Libraries/libnode.dylib',
      'Electron Framework.framework/',
      `${options.name} Helper.app/Contents/MacOS/${options.name} Helper`,
      `${options.name} Helper.app/`,
      `${options.name} Helper EH.app/Contents/MacOS/${options.name} Helper EH`,
      `${options.name} Helper EH.app/`,
      `${options.name} Helper NP.app/Contents/MacOS/${options.name} Helper NP`,
      `${options.name} Helper NP.app/`,
    ].forEach((framework) =>
      execSync(`codesign --deep -fs '${options.sign.app}' --entitlements '${options.child}' '${options.dir}/Contents/Frameworks/${framework}'`),
    );

    execSync(`codesign -fs '${options.sign.app}' --entitlements '${options.child}' '${options.dir}/Contents/MacOS/${options.name}'`,);
    execSync(`codesign -fs '${options.sign.app}' --entitlements '${options.parent}' '${options.dir}'`);
    execSync(`productbuild --component '${options.dir}' /Applications --sign '${options.sign.package}' '${options.name}.pkg'`);
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
