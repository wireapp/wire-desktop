#
# Wire
# Copyright (C) 2016 Wire Swiss GmbH
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

ELECTRON_PACKAGE_JSON = 'electron/package.json'
PACKAGE_JSON = 'package.json'
INFO_JSON = 'info.json'

module.exports = (grunt) ->
  require('load-grunt-tasks') grunt, pattern: ['grunt-*']
  path = require 'path'

  grunt.initConfig
    pkg: grunt.file.readJSON PACKAGE_JSON
    info: grunt.file.readJSON INFO_JSON

    clean:
      wrap: 'wrap'
      build: 'wrap/build'
      dist: 'wrap/dist'
      win: 'wrap/**/<%= info.name %>-win*'
      osx: 'wrap/**/<%= info.name %>-darwin*'
      linux: 'wrap/**/<%= info.name %>-linux*'
      pkg: '*.pkg'

    productbuild:
      options:
        sign:
          app: '<%= info.sign.app %>'
          package: '<%= info.sign.package %>'
        parent: 'resources/osx/entitlements/parent.plist'
        child: 'resources/osx/entitlements/child.plist'
        dir: 'wrap/dist/<%= info.name %>-mas-x64/<%= info.name %>.app'
        name: '<%= info.name %>'

    electron:
      options:
        name: '<%= info.name %>'
        dir: 'electron'
        out: 'wrap/build'
        version: '1.3.1'
        overwrite: true
        arch: 'all'
        asar: true
        'app-copyright': '<%= info.copyright %>'
        'app-version': '<%= info.version %>'
        'build-version': '<%= info.build %>'
        'min-version': '10.9.0'
        protocols: [
          {name: '', schemes: ['wire']}
        ]
      osx_internal:
        options:
          name: '<%= info.nameInternal %>'
          platform: 'mas'
          icon: 'resources/osx/wire.internal.icns'
          'app-bundle-id': 'com.wearezeta.zclient.mac.internal'
          'dev-region': 'en'
      osx_prod:
        options:
          platform: 'mas'
          out: 'wrap/dist/'
          icon: 'resources/osx/wire.icns'
          'app-category-type': 'public.app-category.social-networking'
          'app-bundle-id': 'com.wearezeta.zclient.mac'
          'helper-bundle-id': 'com.wearezeta.zclient.mac.helper'
          'dev-region': 'en'
          'extend-info': 'resources/osx/custom.plist'
      win_internal:
        options:
          name: '<%= info.nameInternal %>'
          platform: 'win32'
          icon: 'resources/win/wire.internal.ico'
          arch: 'ia32'
          'version-string':
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
          'version-string':
            CompanyName: '<%= info.name %>'
            FileDescription: '<%= info.description %>'
            OriginalFilename: '<%= info.name %>.exe'
            ProductName: '<%= info.name %>'
            InternalName: '<%= info.name %>.exe'

      linux:
        options:
          platform: 'linux'

    'create-windows-installer':
      internal:
        title: '<%= info.nameInternal %>'
        description: '<%= info.description %>'
        version: '<%= info.version %>.<%= info.build %>'
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
        version: '<%= info.version %>.<%= info.build %>'
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
          message: 'Release <%= info.version %>.<%= info.build %>'
        files:
          src: [INFO_JSON, ELECTRON_PACKAGE_JSON]

    gittag:
      release:
        options:
          tag: 'release/<%= info.version %>.<%= info.build %>'
          message: 'Release <%= info.version %>.<%= info.build %>'

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
  grunt.registerTask 'build-inc', ->
    info = grunt.config.get 'info'
    info.build = "#{parseInt(info.build, 10) + 1 }"
    grunt.config.set 'info', info
    grunt.file.write INFO_JSON, JSON.stringify(info, null, 2) + '\n'

    electron_pkg = grunt.file.readJSON ELECTRON_PACKAGE_JSON
    electron_pkg.version = "#{info.version}.#{info.build}"
    grunt.file.write ELECTRON_PACKAGE_JSON, JSON.stringify(electron_pkg, null, 2) + '\n'

    grunt.log.write("Build number increased to #{info.build} ").ok();

  grunt.registerTask 'release-internal', ->
    info = grunt.config.get 'info'
    electron_pkg = grunt.file.readJSON ELECTRON_PACKAGE_JSON
    electron_pkg.updateWinUrl = info.updateWinUrlInternal
    electron_pkg.environment = 'internal'
    electron_pkg.name = info.nameInternal.toLowerCase()
    electron_pkg.productName = info.nameInternal
    grunt.file.write ELECTRON_PACKAGE_JSON, JSON.stringify(electron_pkg, null, 2) + '\n'
    grunt.log.write("Releases URL points to #{electron_pkg.updateWinUrl} ").ok();

  grunt.registerTask 'release-prod', ->
    info = grunt.config.get 'info'
    electron_pkg = grunt.file.readJSON ELECTRON_PACKAGE_JSON
    electron_pkg.updateWinUrl = info.updateWinUrlProd
    electron_pkg.environment = 'production'
    electron_pkg.name = info.name.toLowerCase()
    electron_pkg.productName = info.name
    grunt.file.write ELECTRON_PACKAGE_JSON, JSON.stringify(electron_pkg, null, 2) + '\n'
    grunt.log.write("Releases URL points to #{electron_pkg.updateWinUrl} ").ok();

  grunt.registerMultiTask 'electron', 'Package Electron apps', ->
    done = this.async()
    electron_packager @options(), (error) ->
      if (error)
        grunt.warn error
      else
        done()

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


  grunt.registerTask 'release',   ['build-inc', 'gitcommit', 'gittag', 'gitpush']

  grunt.registerTask 'osx',       ['clean:osx', 'release-internal', 'electron:osx_internal']
  grunt.registerTask 'osx-prod',  ['clean:osx', 'release-prod', 'electron:osx_prod', 'productbuild']

  grunt.registerTask 'win',       ['clean:win', 'release-internal', 'electron:win_internal', 'create-windows-installer:internal']
  grunt.registerTask 'win-prod',  ['clean:win', 'release-prod', 'electron:win_prod', 'create-windows-installer:prod']

  grunt.registerTask 'linux',     ['clean:linux', 'release-internal', 'electron:linux']
