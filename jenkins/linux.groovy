@NonCPS
def parseJson(def text) {
  new groovy.json.JsonSlurperClassic().parseText(text)
}

node('linux') {
  checkout scm

  def production = params.PRODUCTION
  def custom = params.CUSTOM

  def jenkinsbot_secret = ''
  withCredentials([string(credentialsId: "${params.JENKINSBOT_SECRET}", variable: 'JENKINSBOT_SECRET')]) {
    jenkinsbot_secret = env.JENKINSBOT_SECRET
  }

  if (!production && !custom) {
    env.APP_ENV = 'internal'
  }

  def environment = docker.build('node', '-f jenkins/linux.Dockerfile .')
  def version
  def electronVersion

  environment.inside {

    stage('Checkout & Clean') {
      git branch: "${GIT_BRANCH}", url: 'https://github.com/wireapp/wire-desktop.git'
      sh returnStatus: true, script: 'rm -rf $WORKSPACE/node_modules/ $WORKSPACE/*.sig'
    }

    def wireJson = readFile('electron/wire.json')
    def (major, minor) = parseJson(wireJson).version.tokenize('.')
    version = "${major}.${minor}.${env.BUILD_NUMBER}"
    currentBuild.displayName = version

    def packageJson = readFile('package.json')
    electronVersion = parseJson(packageJson).devDependencies.electron

    stage('Build') {
      try {
        sh 'node -v'
        sh 'npm -v'
        sh 'yarn'
        sh 'yarn build:linux'
      } catch(e) {
        currentBuild.result = 'FAILED'
        wireSend secret: "${jenkinsbot_secret}", message: "🐧 **${JOB_NAME} ${version} build failed**\n${BUILD_URL}"
        throw e
      }
    }

    stage('Generate repository') {
      withCredentials([file(credentialsId: 'D599C1AA126762B1.asc', variable: 'PGP_PRIVATE_KEY_FILE'), string(credentialsId: 'PGP_PASSPHRASE', variable: 'PGP_PASSPHRASE')]) {
        sh 'cd wrap/dist/ && ../../bin/repo/linux-prod-repo.sh'
      }
    }

    stage('Create SHA256 checksums') {
      withCredentials([file(credentialsId: 'D599C1AA126762B1.asc', variable: 'PGP_PRIVATE_KEY_FILE'), string(credentialsId: 'PGP_PASSPHRASE', variable: 'PGP_PASSPHRASE')]) {
        sh "cd wrap/dist/ && ../../bin/linux-checksums.sh ${version}"
      }
    }

    stage('Test packaging') {
        sh 'dpkg-deb --info wrap/dist/debian/pool/main/*amd64.deb'
        sh 'dpkg-deb --info wrap/dist/*amd64.deb'
    }

    stage('Save .deb, AppImage and repo files') {
      archiveArtifacts 'package.json,wrap/dist/*.deb,wrap/dist/*.AppImage,wrap/dist/*.rpm,wrap/dist/*.asc,wrap/dist/debian/**'
    }

  }

  wireSend secret: "${jenkinsbot_secret}", message: "🐧 **New build of ${JOB_NAME} ${version}**\n- Download: [Jenkins](${BUILD_URL})\n- Electron version: ${electronVersion}\n- Branch: [${GIT_BRANCH}](https://github.com/wireapp/wire-desktop/commits/${GIT_BRANCH})"
}
