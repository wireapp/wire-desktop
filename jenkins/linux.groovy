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

  def text = readFile('electron/wire.json')
  def (major, minor) = parseJson(text).version.tokenize('.')
  def version = "${major}.${minor}.${env.BUILD_NUMBER}"
  currentBuild.displayName = version

  def environment = docker.build('node', '-f jenkins/linux.Dockerfile .')

  environment.inside {

    stage('Checkout & Clean') {
      git branch: "${GIT_BRANCH}", url: 'https://github.com/wireapp/wire-desktop.git'
      sh returnStatus: true, script: 'rm -rf $WORKSPACE/node_modules/ $WORKSPACE/*.sig'
    }

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
        if (production) {
          sh 'cd wrap/dist/ && ../../bin/repo/linux-prod-repo.sh'
        }
      }
    }

    stage('Create SHA256 checksums') {
      withCredentials([file(credentialsId: 'D599C1AA126762B1.asc', variable: 'PGP_PRIVATE_KEY_FILE'), string(credentialsId: 'PGP_PASSPHRASE', variable: 'PGP_PASSPHRASE')]) {
        if (production) {
          sh "cd wrap/dist/ && ../../bin/linux-checksums.sh ${version}"
        }
      }
    }

    stage('Test packaging') {
        if (production) {
          sh 'dpkg-deb --info wrap/dist/debian/pool/main/*amd64.deb'
        } else {
          sh 'dpkg-deb --info wrap/dist/*amd64.deb'
        }
    }

    stage('Save .deb, AppImage and repo files') {
      archiveArtifacts 'wrap/dist/**'
    }

  }

  wireSend secret: "${jenkinsbot_secret}", message: "🐧 **New build of ${JOB_NAME} ${version}**\nDownload from [Jenkins](${BUILD_URL})"
}
