@NonCPS
def parseJson(def text) {
  new groovy.json.JsonSlurperClassic().parseText(text)
}

node('master') {
  def production = params.PRODUCTION
  def custom = params.CUSTOM
  def NODE = tool name: 'node-v12.3.1', type: 'nodejs'

  def jenkinsbot_secret = ''
  withCredentials([string(credentialsId: "${params.JENKINSBOT_SECRET}", variable: 'JENKINSBOT_SECRET')]) {
    jenkinsbot_secret = env.JENKINSBOT_SECRET
  }

  if (!production && !custom) {
    env.APP_ENV = 'internal'
  }

  stage('Checkout & Clean') {
    git branch: "${GIT_BRANCH}", url: 'https://github.com/wireapp/wire-desktop.git'
    sh returnStatus: true, script: 'rm -rf node_modules/ *.sig'
  }

  def text = readFile('electron/wire.json')
  def (major, minor) = parseJson(text).version.tokenize('.')
  def version = "${major}.${minor}.${env.BUILD_NUMBER}"
  currentBuild.displayName = version

  stage('Build') {
    try {
      withCredentials([string(credentialsId: 'MACOS_KEYCHAIN_PASSWORD', variable: 'MACOS_KEYCHAIN_PASSWORD')]) {
        sh "security unlock-keychain -p ${MACOS_KEYCHAIN_PASSWORD} /Users/jenkins/Library/Keychains/login.keychain"
      }
      withEnv(["PATH+NODE=${NODE}/bin"]) {
        sh 'node -v'
        sh 'npm -v'
        sh 'npm install -g yarn'
        sh 'yarn'
        sh 'yarn build:macos'
      }
    } catch(e) {
      currentBuild.result = 'FAILED'
      wireSend secret: "${jenkinsbot_secret}", message: "🍏 **${JOB_NAME} ${version} build failed** see: ${JOB_URL}"
      throw e
    }
  }

  if (production) {
    stage('Create SHA256 checksums') {
      withCredentials([file(credentialsId: 'D599C1AA126762B1.asc', variable: 'PGP_PRIVATE_KEY_FILE'), string(credentialsId: 'PGP_PASSPHRASE', variable: 'PGP_PASSPHRASE')]) {
        sh "bin/macos-checksums.sh ${version}"
      }
    }
  }

  stage('Archive build artifacts') {
    if (production) {
      archiveArtifacts 'Wire.pkg'
    } else if (custom) {
      archiveArtifacts '*.pkg'
    } else {
      // Internal
      sh "ditto -c -k --sequesterRsrc --keepParent \"${WORKSPACE}/wrap/build/WireInternal-mas-x64/WireInternal.app/\" \"${WORKSPACE}/wrap/WireInternal.zip\""
      archiveArtifacts "wrap/WireInternal.zip,${version}.tar.gz.sig"
    }
  }

  stage('Trigger smoke tests') {
    if (production) {
      try {
        build job: 'Wrapper_macOS_Smoke_Tests', parameters: [run(description: '', name: 'WRAPPER_BUILD', runId: "Wrapper_macOS_Production#${BUILD_ID}"), string(name: 'WEBAPP_ENV', value: 'https://wire-webapp-rc.zinfra.io/')], wait: false
      } catch(e) {
        wireSend secret: "${jenkinsbot_secret}", message: "🍏 **${JOB_NAME} Unable to trigger smoke tests for ${version}** see: ${JOB_URL}"
      }
    }
  }

  wireSend secret: "${jenkinsbot_secret}", message: "🍏 **New build of ${JOB_NAME} ${version} available for download on** ${JOB_URL}"
}
