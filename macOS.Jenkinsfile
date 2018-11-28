@NonCPS
def parseJson(def text) {
  new groovy.json.JsonSlurperClassic().parseText(text)
}

node('master') {

  def production = params.PRODUCTION

  def jenkinsbot_secret = ''
  withCredentials([string(credentialsId: "${params.JENKINSBOT_SECRET}", variable: 'JENKINSBOT_SECRET')]) {
    jenkinsbot_secret = env.JENKINSBOT_SECRET
  }

  stage('Checkout & Clean') {
    git branch: "${GIT_BRANCH}", url: 'https://github.com/wireapp/wire-desktop.git'
    sh returnStatus: true, script: 'rm -rf wrap/ electron/node_modules/ node_modules/'
  }

  def text = readFile('info.json')
  def buildInfo = parseJson(text)
  def version = buildInfo.version + '.' + env.BUILD_NUMBER
  currentBuild.displayName = version;

  stage('Build') {
    try {
      sh 'security unlock-keychain -p 123456 /Users/jenkins/Library/Keychains/login.keychain'
      sh 'pip install -r requirements.txt'
      def NODE = tool name: 'node-v8.14.0', type: 'nodejs'
      withEnv(["PATH+NODE=${NODE}/bin"]) {
        sh 'node -v'
        sh 'npm -v'
        sh 'npm install -g yarn'
        sh 'yarn'
        sh 'yarn build:ts'
        withCredentials([string(credentialsId: 'RAYGUN_API_KEY', variable: 'RAYGUN_API_KEY')]) {
          if(production) {
            // Production
            sh 'npx grunt macos-prod'
          } else {
            // Internal
            sh 'npx grunt macos'
          }
        }
      }
    } catch(e) {
      currentBuild.result = 'FAILED'
      wireSend secret: "${jenkinsbot_secret}", message: "🍏 **${JOB_NAME} ${version} build failed** see: ${JOB_URL}"
      throw e
    }
  }

  if(production) {
    stage('Create SHA256 checksums') {
      withCredentials([file(credentialsId: 'D599C1AA126762B1.asc', variable: 'PGP_PRIVATE_KEY_FILE'), string(credentialsId: 'PGP_PASSPHRASE', variable: 'PGP_PASSPHRASE')]) {
        sh 'bin/macos-checksums.sh'
      }
    }
  }

  stage('Archive build artifacts') {
    if(production) {
      // Production
      archiveArtifacts 'info.json,Wire.pkg'
    } else {
      // Internal
      sh "ditto -c -k --sequesterRsrc --keepParent \"${WORKSPACE}/wrap/build/WireInternal-mas-x64/WireInternal.app/\" \"${WORKSPACE}/bin/WireInternal.zip\""
      archiveArtifacts 'info.json,bin/WireInternal.zip'
    }
  }

  if(production) {
    stage('Upload build as draft to GitHub') {
      withCredentials([string(credentialsId: 'GITHUB_ACCESS_TOKEN', variable: 'GITHUB_ACCESS_TOKEN')]) {
        sh 'python bin/github_draft.py'
      }
    }
  }

  wireSend secret: "${jenkinsbot_secret}", message: "🍏 **New build of ${JOB_NAME} ${version} available for download on** ${JOB_URL}"
}
