@NonCPS
def parseJson(def text) {
  new groovy.json.JsonSlurperClassic().parseText(text)
}

node('built-in') {
  def production = params.PRODUCTION
  def custom = params.CUSTOM
  def NODE = tool name: 'node-v18.18.0', type: 'nodejs'
  def privateAPIResult = ''

  def jenkinsbot_secret = ''
  withCredentials([string(credentialsId: "${params.JENKINSBOT_SECRET}", variable: 'JENKINSBOT_SECRET')]) {
    jenkinsbot_secret = env.JENKINSBOT_SECRET
  }

  if (!production && !custom) {
    env.APP_ENV = 'internal'
  }

  stage('Checkout & Clean') {
    git branch: "${GIT_BRANCH}", url: 'https://github.com/wireapp/wire-desktop.git'
    sh returnStatus: true, script: 'rm -rf node_modules/ *.sig *.pkg'
  }

  def wireJson = readFile('electron/wire.json')
  def packageJson = readFile('package.json')
  def (major, minor) = parseJson(wireJson).version.tokenize('.')
  def version = "${major}.${minor}.${env.BUILD_NUMBER}"
  def electronVersion = parseJson(packageJson).devDependencies.electron
  currentBuild.displayName = version

  stage('Build') {
    try {
      withCredentials([string(credentialsId: 'MACOS_KEYCHAIN_PASSWORD', variable: 'MACOS_KEYCHAIN_PASSWORD')]) {
        sh 'security unlock-keychain -p \"$MACOS_KEYCHAIN_PASSWORD\" /Users/jenkins/Library/Keychains/login.keychain-db'
      }
      withEnv(["PATH+NODE=${NODE}/bin"]) {
        sh 'node -v'
        sh 'npm -v'
        sh 'npm install -g yarn'
        sh 'yarn'
        if (production) {
          withCredentials([string(credentialsId: 'APPLE_EXPORT_COMPLIANCE_CODE', variable: 'APPLE_EXPORT_COMPLIANCE_CODE')]) {
            sh 'yarn build:macos'
          }

          echo 'Checking for private Apple APIs ...'
          privateAPIResult = sh script: 'bin/macos-check_private_apis.sh "wrap/build/Wire-mas-universal/Wire.app"', returnStdout: true
          echo privateAPIResult
        } else if (custom) {
          sh 'yarn build:macos'
        } else {
          // internal
          sh 'yarn build:macos:internal'

          echo 'Checking for private Apple APIs ...'
          privateAPIResult = sh script: 'bin/macos-check_private_apis.sh "wrap/build/WireInternal-mas-universal/WireInternal.app"', returnStdout: true
          echo privateAPIResult
        }
      }
    } catch(e) {
      currentBuild.result = 'FAILED'
      wireSend secret: "${jenkinsbot_secret}", message: "🍏 **${JOB_NAME} ${version} build failed**\n${BUILD_URL}"
      throw e
    }
  }

  if (production) {
    stage('Create SHA256 checksums') {
      withCredentials([file(credentialsId: 'D599C1AA126762B1.asc', variable: 'PGP_PRIVATE_KEY_FILE'), string(credentialsId: 'PGP_PASSPHRASE', variable: 'PGP_PASSPHRASE')]) {
        sh "cd wrap/dist && ../../bin/macos-checksums.sh ${version}"
      }
    }
  }

  stage('Archive build artifacts') {
    // TODO (mac auto-update v2):
    // This Jenkins step manually generates latest-mac.yml and uploads artifacts to wire-taco.
    // Once macOS wrapper builds are moved to electron-builder, drop this and use
    // `electron-builder --publish` to create + upload the update metadata instead.

    if (!production && !custom) {
      // Internal
      def appPath = "${WORKSPACE}/wrap/build/WireInternal-mas-universal/WireInternal.app/"
      def distDir = "${WORKSPACE}/wrap/dist"
      def baseZipName = "WireInternal.zip"
      def versionedZipName = "WireInternal-${version}.zip"

      sh """
        mkdir -p "${distDir}"
        ditto -c -k --sequesterRsrc --keepParent "${appPath}" "${distDir}/${baseZipName}"
        cp "${distDir}/${baseZipName}" "${distDir}/${versionedZipName}"
      """

      // Compute size and sha512 (base64) for electron-updater generic provider
      def size = sh(
        script: "stat -f%z \"${distDir}/${versionedZipName}\"",
        returnStdout: true
      ).trim()

      def sha512Base64 = sh(
        script: "shasum -a 512 \"${distDir}/${versionedZipName}\" | awk '{print \$1}' | xxd -r -p | base64",
        returnStdout: true
      ).trim()

      def releaseDate = sh(
        script: "date -u +%Y-%m-%dT%H:%M:%S.000Z",
        returnStdout: true
      ).trim()

      // Write latest-mac.yml in the format electron-updater expects
      writeFile file: "${distDir}/latest-mac.yml", text: """
  version: ${version}
  files:
    - url: ${versionedZipName}
      sha512: ${sha512Base64}
      size: ${size}
  path: ${versionedZipName}
  sha512: ${sha512Base64}
  releaseDate: '${releaseDate}'
  """.stripIndent()
    }

    archiveArtifacts "package.json,wrap/dist/**"
    sh returnStatus: true, script: 'rm -rf wrap/'
  }


  stage('Trigger smoke tests') {
    if (production) {
      try {
        build job: 'Wrapper_macOS_Smoke_Tests', parameters: [run(description: '', name: 'WRAPPER_BUILD', runId: "Wrapper_macOS_Production#${BUILD_ID}"), string(name: 'WEBAPP_ENV', value: 'https://wire-webapp-master.zinfra.io/')], wait: false
      } catch(e) {
        wireSend secret: "${jenkinsbot_secret}", message: "🍏 **${JOB_NAME} Unable to trigger smoke tests for ${version}**\n${BUILD_URL}"
        print e
      }
    }
  }

  wireSend secret: "${jenkinsbot_secret}", message: "🍏 **New build of ${JOB_NAME} ${version}**\n- Download: [Jenkins](${BUILD_URL})\n- Electron version: ${electronVersion}\n- Branch: [${GIT_BRANCH}](https://github.com/wireapp/wire-desktop/commits/${GIT_BRANCH})\n\n${privateAPIResult.trim()}"
}
