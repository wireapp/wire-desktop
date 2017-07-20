#
# Wire
# Copyright (C) 2017 Wire Swiss GmbH
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see http://www.gnu.org/licenses/.
#

electron_packager = require 'electron-packager'
createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
electron_builder = require 'electron-builder'

ELECTRON_PACKAGE_JSON = 'electron/package.json'
PACKAGE_JSON = 'package.json'
INFO_JSON = 'info.json'

module.exports = (grunt) ->
  require('load-grunt-tasks') grunt, pattern: ['grunt-*']
  path = require 'path'

  grunt.initConfig
    pkg: grunt.file.readJSON PACKAGE_JSON
    info: grunt.file.readJSON INFO_JSON
    build_number: "#{process.env.BUILD_NUMBER or '0'}"

    clean:
      wrap: 'wrap'
      build: 'wrap/build'
      dist: 'wrap/dist'
      win: 'wrap/**/<%= info.name %>-win*'
      macos: 'wrap/**/<%= info.name %>-darwin*'
      linux: ['wrap/**/linux*', 'wrap/**/wire*']
      pkg: '*.pkg'

    'update-keys':
      options:
        config: 'electron/js/config.js'

    productbuild:
      options:
        sign:
          app: '<%= info.sign.app %>'
          package: '<%= info.sign.package %>'
        parent: 'resources/macos/entitlements/parent.plist'
        child: 'resources/macos/entitlements/child.plist'
        dir: 'wrap/dist/<%= info.name %>-mas-x64/<%= info.name %>.app'
        name: '<%= info.name %>'

    electron:
      options:
        name: '<%= info.name %>'
        dir: 'electron'
        out: 'wrap/build'
        overwrite: true
        arch: 'all'
        asar: true
        appCopyright: '<%= info.copyright %>'
        appVersion: '<%= info.version %>'
        buildVersion: '<%= build_number %>'
        ignore: 'electron/renderer/src'
        protocols: [
          {name: '', schemes: ['wire']}
        ]
      macos_internal:
        options:
          name: '<%= info.nameInternal %>'
          platform: 'mas'
          icon: 'resources/macos/wire.internal.icns'
          appBundleId: 'com.wearezeta.zclient.mac.internal'
      macos_prod:
        options:
          platform: 'mas'
          out: 'wrap/dist/'
          icon: 'resources/macos/wire.icns'
          appCategoryType: 'public.app-category.social-networking'
          appBundleId: 'com.wearezeta.zclient.mac'
          helperBundleId: 'com.wearezeta.zclient.mac.helper'
          extendInfo: 'resources/macos/custom.plist'
      win_internal:
        options:
          name: '<%= info.nameInternal %>'
          platform: 'win32'
          icon: 'resources/win/wire.internal.ico'
          arch: 'ia32'
          win32metadata:
            CompanyName: '<%= info.name %>'
            FileDescription: '<%= info.description %>'
            OriginalFilename: '<%= info.nameInternal %>.exe'
            ProductName: '<%= info.nameInternal %>'
            InternalName: '<%= info.nameInternal %>.exe'

      win_prod:
        options:
          platform: 'win32'
          icon: 'resources/win/wire.ico'
          arch: 'ia32'
          win32metadata:
            CompanyName: '<%= info.name %>'
            FileDescription: '<%= info.description %>'
            OriginalFilename: '<%= info.name %>.exe'
            ProductName: '<%= info.name %>'
            InternalName: '<%= info.name %>.exe'

    electronbuilder:
      options:
        asar: false
        arch: 'all'
      linux_prod:
        options:
          productName: 'wire-desktop'
          targets: ['deb', 'AppImage']
          linux:
            fpm: ['--name', 'wire-desktop']
            executableName: 'wire-desktop'
            afterInstall: 'bin/deb/after-install.tpl'
            afterRemove: 'bin/deb/after-remove.tpl'
            category: 'Network'
            depends: ['libappindicator1', 'libasound2', 'libgconf-2-4', 'libnotify-bin', 'libnss3', 'libxss1']
      linux_internal:
        options:
          productName: 'wire-desktop-internal'
          targets: ['deb', 'AppImage']
          linux:
            fpm: ['--name', 'wire-desktop-internal']
            executableName: 'wire-desktop-internal'
            afterInstall: 'bin/deb/after-install.tpl'
            afterRemove: 'bin/deb/after-remove.tpl'
            category: 'Network'
            depends: ['libappindicator1', 'libasound2', 'libgconf-2-4', 'libnotify-bin', 'libnss3', 'libxss1']
      linux_other:
        options:
          arch: "#{grunt.option('arch') || process.arch}"
          productName: 'wire-desktop'
          targets: ["#{grunt.option('target') || 'dir'}"]
          linux:
            fpm: ['--name', 'wire-desktop']
            executableName: 'wire-desktop'

    'create-windows-installer':
      internal:
        title: '<%= info.nameInternal %>'
        description: '<%= info.description %>'
        version: '<%= info.version %>.<%= build_number %>'
        appDirectory: 'wrap/build/<%= info.nameInternal %>-win32-ia32'
        outputDirectory: 'wrap/internal/<%= info.nameInternal %>-win32-ia32'
        authors: '<%= info.nameInternal %>'
        exe: '<%= info.nameInternal %>.exe'
        setupIcon: 'resources/win/wire.internal.ico'
        noMsi: true
        loadingGif: 'resources/win/icon.internal.256x256.png'
        iconUrl: 'https://wire-app.wire.com/win/internal/wire.internal.ico'
      prod:
        title: '<%= info.name %>'
        description: '<%= info.description %>'
        version: '<%= info.version %>.<%= build_number %>'
        appDirectory: 'wrap/build/<%= info.name %>-win32-ia32'
        outputDirectory: 'wrap/prod/<%= info.name %>-win32-ia32'
        authors: '<%= info.name %>'
        exe: '<%= info.name %>.exe'
        setupIcon: 'resources/win/wire.ico'
        noMsi: true
        loadingGif: 'resources/win/icon.256x256.png'
        iconUrl: 'https://wire-app.wire.com/win/prod/wire.ico'

    gitcommit:
      release:
        options:
          message: 'Bump version to <%= info.version %>'
        files:
          src: [INFO_JSON, ELECTRON_PACKAGE_JSON]

    gitpush:
      task:
        options:
          tags: true
          branch: 'master'

    githubChanges:
      release:
        options:
          auth: true
          onlyPulls: true
          useCommitBody: true
          owner : 'wireapp'
          repository : 'wire-desktop'

###############################################################################
# Tasks
###############################################################################
  grunt.registerTask 'version-inc', ->
    info = grunt.config.get 'info'
    info.version = "#{parseInt(info.version, 10) + 1}"
    grunt.config.set 'info', info
    grunt.file.write INFO_JSON, "#{JSON.stringify info, null, 2}\n"

    electron_pkg = grunt.file.readJSON ELECTRON_PACKAGE_JSON
    electron_pkg.version = "#{info.version}"
    grunt.file.write ELECTRON_PACKAGE_JSON, "#{JSON.stringify electron_pkg, null, 2}\n"

    grunt.log.write("Version number increased to #{info.version} ").ok();

  grunt.registerTask 'release-internal', ->
    info = grunt.config.get 'info'
    build_number = grunt.config.get 'build_number'
    commit_id = grunt.config('gitinfo.local.branch.current.shortSHA')
    electron_pkg = grunt.file.readJSON ELECTRON_PACKAGE_JSON
    electron_pkg.updateWinUrl = info.updateWinUrlInternal
    electron_pkg.environment = 'internal'
    electron_pkg.name = info.nameInternal.toLowerCase()
    electron_pkg.productName = info.nameInternal
    if(build_number == '0')
      electron_pkg.version = "#{info.version}.0-#{commit_id}-internal"
    else
      electron_pkg.version = "#{info.version}.#{build_number}-internal"
    grunt.file.write ELECTRON_PACKAGE_JSON, "#{JSON.stringify electron_pkg, null, 2}\n"
    grunt.log.write("Releases URL points to #{electron_pkg.updateWinUrl} ").ok();

  grunt.registerTask 'release-prod', ->
    info = grunt.config.get 'info'
    build_number = grunt.config.get 'build_number'
    commit_id = grunt.config('gitinfo.local.branch.current.shortSHA')
    electron_pkg = grunt.file.readJSON ELECTRON_PACKAGE_JSON
    electron_pkg.updateWinUrl = info.updateWinUrlProd
    electron_pkg.environment = 'production'
    electron_pkg.name = info.name.toLowerCase()
    electron_pkg.productName = info.name
    if(build_number == '0')
      electron_pkg.version = "#{info.version}.0-#{commit_id}"
    else
      electron_pkg.version = "#{info.version}.#{build_number}"
    grunt.file.write ELECTRON_PACKAGE_JSON, "#{JSON.stringify electron_pkg, null, 2}\n"
    grunt.log.write("Releases URL points to #{electron_pkg.updateWinUrl} ").ok();

  grunt.registerMultiTask 'electron', 'Package Electron apps', ->
    done = @async()
    electron_packager @options(), (error) ->
      if (error)
        grunt.warn error
      else
        done()

  grunt.registerMultiTask 'electronbuilder', 'Build Electron apps', ->
    done = @async()
    options = @options()
    targets = options.targets
    delete options.targets
    arch = options.arch
    delete options.arch

    if arch == 'all'
      electron_builder.build
        targets: electron_builder.Platform.LINUX.createTarget targets, electron_builder.Arch.ia32, electron_builder.Arch.x64
        config: options
    else
      electron_builder.build
        targets: electron_builder.Platform.LINUX.createTarget targets, electron_builder.archFromString arch
        config: options

  grunt.registerTask 'update-keys', ->
    options = @options()

    config_string = grunt.file.read options.config

    if config_string?
      new_config_string = config_string
        .replace "RAYGUN_API_KEY: ''", "RAYGUN_API_KEY: '#{process.env.RAYGUN_API_KEY or ''}'"
        .replace "GOOGLE_CLIENT_ID: ''", "GOOGLE_CLIENT_ID: '#{process.env.GOOGLE_CLIENT_ID or ''}'"
        .replace "GOOGLE_CLIENT_SECRET: ''", "GOOGLE_CLIENT_SECRET: '#{process.env.GOOGLE_CLIENT_SECRET or ''}'"
      grunt.file.write options.config, new_config_string
    else
      grunt.warn 'Failed updating keys in config'

  grunt.registerTask 'productbuild', 'Build Mac Appstore package', ->
    execSync = require('child_process').execSync
    options = @options()

    [
      'Electron Framework.framework/Versions/A/Electron Framework'
      'Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib'
      'Electron Framework.framework/Versions/A/Libraries/libnode.dylib'
      'Electron Framework.framework/'
      "#{options.name} Helper.app/Contents/MacOS/#{options.name} Helper"
      "#{options.name} Helper.app/"
      "#{options.name} Helper EH.app/Contents/MacOS/#{options.name} Helper EH"
      "#{options.name} Helper EH.app/"
      "#{options.name} Helper NP.app/Contents/MacOS/#{options.name} Helper NP"
      "#{options.name} Helper NP.app/"
    ].forEach (framework) ->
      execSync "codesign --deep -fs '#{options.sign.app}' --entitlements '#{options.child}' '#{options.dir}/Contents/Frameworks/#{framework}'"

    execSync "codesign -fs '#{options.sign.app}' --entitlements '#{options.child}' '#{options.dir}/Contents/MacOS/#{options.name}'"
    execSync "codesign -fs '#{options.sign.app}' --entitlements '#{options.parent}' '#{options.dir}'"
    execSync "productbuild --component '#{options.dir}' /Applications --sign '#{options.sign.package}' '#{options.name}.pkg'"

  grunt.registerMultiTask 'create-windows-installer', 'Create the Windows installer', ->
    @requiresConfig "#{@name}.#{@target}.appDirectory"

    config = grunt.config "#{@name}.#{@target}"
    done = @async()
    createWindowsInstaller(config).then done, done

  grunt.registerTask 'bundle', 'Bundle React app', ->
    execSync = require('child_process').execSync
    execSync 'npm run bundle'

  grunt.registerTask 'bump-version',  ['version-inc', 'gitcommit', 'gitpush']

  grunt.registerTask 'macos',         ['clean:macos', 'update-keys', 'gitinfo', 'release-internal', 'bundle', 'electron:macos_internal']
  grunt.registerTask 'macos-prod',    ['clean:macos', 'update-keys', 'gitinfo', 'release-prod', 'bundle', 'electron:macos_prod', 'productbuild']

  grunt.registerTask 'win',           ['clean:win', 'update-keys', 'gitinfo', 'release-internal', 'bundle', 'electron:win_internal', 'create-windows-installer:internal']
  grunt.registerTask 'win-prod',      ['clean:win', 'update-keys', 'gitinfo', 'release-prod', 'bundle', 'electron:win_prod', 'create-windows-installer:prod']

  grunt.registerTask 'linux',         ['clean:linux', 'update-keys', 'gitinfo', 'release-internal', 'bundle', 'electronbuilder:linux_internal']
  grunt.registerTask 'linux-prod',    ['clean:linux', 'update-keys', 'gitinfo', 'release-prod', 'bundle', 'electronbuilder:linux_prod']
  grunt.registerTask 'linux-other',   ['clean:linux', 'update-keys', 'gitinfo', 'release-prod', 'bundle', 'electronbuilder:linux_other']
