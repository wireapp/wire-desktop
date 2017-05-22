@NonCPS
def parseJson(def text) {
  new groovy.json.JsonSlurperClassic().parseText(text)
}

node('master') {

  def production = ${params.PRODUCTION}

  def jenkinsbot_secret = ""
  withCredentials([string(credentialsId: "${params.JENKINSBOT_SECRET}", variable: 'JENKINSBOT_SECRET')]) {
    jenkinsbot_secret = env.JENKINSBOT_SECRET
  }

  stage('Checkout & Clean') {
    git branch: "${GIT_BRANCH}", url: 'https://github.com/wireapp/wire-desktop.git'
    sh returnStatus: true, script: 'rm -rf wrap/'
    sh returnStatus: true, script: 'rm -rf electron/node_modules/'
    sh returnStatus: true, script: 'rm -rf node_modules/'
    sh returnStatus: true, script: 'rm -rf bin/WireInternal.zip'
  }

  def text = readFile("info.json")
  def buildInfo = parseJson(text);
  def version = buildInfo.version + "." + buildInfo.build;
  currentBuild.displayName = version + " #" + currentBuild.id

  stage('Install rust') {
    withEnv(['PATH+RUST=/Users/jenkins/.cargo/bin']) {
      def rust = sh returnStatus: true, script: 'rustc --version'
      if(rust != 0) {
        sh 'curl https://sh.rustup.rs -sSf | sh -s -- -y'
        sh 'rustc --version'
      }
    }
  }

  stage('Build') {
    try {
      sh 'security unlock-keychain -p 123456 /Users/jenkins/Library/Keychains/login.keychain'
      sh 'pip install -r requirements.txt'
      def NODE = tool name: 'node-v8.0.0-darwin-x64', type: 'nodejs'
      withEnv(['PATH+RUST=/Users/jenkins/.cargo/bin',"PATH+NODE=$NODE/bin"]) {
        sh "node -v"
        sh 'npm install'
        withCredentials([string(credentialsId: 'GOOGLE_CLIENT_ID', variable: 'GOOGLE_CLIENT_ID'), string(credentialsId: 'GOOGLE_CLIENT_SECRET', variable: 'GOOGLE_CLIENT_SECRET'), string(credentialsId: 'RAYGUN_API_KEY', variable: 'RAYGUN_API_KEY')]) {
          if(production) {
            // Production
            sh 'grunt macos-prod'
          } else {
            // Internal
            sh 'grunt macos'
          }
        }
      }
    } catch(e) {
      currentBuild.result = "FAILED"
      wireSend secret: "$jenkinsbot_secret", message: "🍏 **${JOB_NAME} ${version} build failed** see: ${JOB_URL}"
      throw e
    }
  }

  stage('Archive build artifacts') {
    if(production) {
      // Production
      archiveArtifacts 'info.json,Wire.pkg'
    } else {
      // Internal
      sh "ditto -c -k --sequesterRsrc --keepParent \"$WORKSPACE/wrap/build/WireInternal-mas-x64/WireInternal.app/\" \"$WORKSPACE/bin/WireInternal.zip\""
      archiveArtifacts 'info.json,bin/WireInternal.zip'
    }
  }

  wireSend secret: "$jenkinsbot_secret", message: "🍏 **New build of ${JOB_NAME} ${version} available for download on** ${JOB_URL}"
}
