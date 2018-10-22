@NonCPS
def parseJson(def text) {
  new groovy.json.JsonSlurperClassic().parseText(text)
}

node('node160') {

  def production = params.PRODUCTION

  def jenkinsbot_secret = ''
  withCredentials([string(credentialsId: "${params.JENKINSBOT_SECRET}", variable: 'JENKINSBOT_SECRET')]) {
    jenkinsbot_secret = env.JENKINSBOT_SECRET
  }

  stage('Checkout & Clean') {
    git branch: "${GIT_BRANCH}", url: 'https://github.com/wireapp/wire-desktop.git'
    bat returnStatus: true, script: 'rmdir /s /q "wrap"'
    bat returnStatus: true, script: 'rmdir /s /q "node_modules"'
    bat returnStatus: true, script: 'rmdir /s /q "electron\\node_modules"'
  }

  def text = readFile('info.json')
  def buildInfo = parseJson(text)
  def version = buildInfo.version + '.' + env.BUILD_NUMBER
  currentBuild.displayName = version;

  stage('Build') {
    try {
      bat 'pip install -r requirements.txt'
      def NODE = tool name: 'node-v8.11.3-windows-x86', type: 'nodejs'
      withEnv(["PATH+NODE=${NODE}",'npm_config_target_arch=ia32','wire_target_arch=ia32']) {
        bat 'node -v'
        bat 'npm -v'
        bat 'set "VSCMD_START_DIR=%CD%" & "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Community\\Common7\\Tools\\VsDevCmd.bat" & npm install'
        withCredentials([string(credentialsId: 'GOOGLE_CLIENT_ID', variable: 'GOOGLE_CLIENT_ID'), string(credentialsId: 'GOOGLE_CLIENT_SECRET', variable: 'GOOGLE_CLIENT_SECRET'), string(credentialsId: 'RAYGUN_API_KEY', variable: 'RAYGUN_API_KEY')]) {
          if(production) {
            bat 'npx grunt win-prod'
          } else {
            bat 'npx grunt win'
          }
        }
      }
    } catch(e) {
      currentBuild.result = 'FAILED'
      wireSend secret: "${jenkinsbot_secret}", message: "**${JOB_NAME} ${version} build failed** see: ${JOB_URL}"
      throw e
    }
  }

  stage('Sign build') {
    try {
      if(production) {
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\build\\Wire-win32-ia32\\Update.exe"'
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\build\\Wire-win32-ia32\\Wire.exe"'
      } else {
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\build\\WireInternal-win32-ia32\\Update.exe"'
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\build\\WireInternal-win32-ia32\\WireInternal.exe"'
      }
    } catch(e) {
      currentBuild.result = 'FAILED'
      wireSend secret: "${jenkinsbot_secret}", message: "**${JOB_NAME} ${version} signing failed** see: ${JOB_URL}"
      throw e
    }
  }

  stage('Build installer') {
    try {
      def NODE = tool name: 'node-v8.11.3', type: 'nodejs'
      withEnv(["PATH+NODE=${NODE}",'npm_config_target_arch=ia32','wire_target_arch=ia32']) {
        if(production) {
          bat 'npx grunt create-windows-installer:prod'
        } else {
          bat 'npx grunt create-windows-installer:internal'
        }
      }
    } catch(e) {
      currentBuild.result = 'FAILED'
      wireSend secret: "${jenkinsbot_secret}", message: "**${JOB_NAME} ${version} building installer failed** see: ${JOB_URL}"
      throw e
    }
  }

  stage('Sign installer') {
    try {
      if(production) {
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\prod\\Wire-win32-ia32\\WireSetup.exe"'
      } else {
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\internal\\WireInternal-win32-ia32\\WireInternalSetup.exe"'
      }
    } catch(e) {
      currentBuild.result = 'FAILED'
      wireSend secret: "${jenkinsbot_secret}", message: "**${JOB_NAME} ${version} signing installer failed** see: ${JOB_URL}"
      throw e
    }
  }

  stage('Archive build artifacts') {
    if(production) {
      archiveArtifacts 'info.json,wrap\\prod\\Wire-win32-ia32\\**'
    } else {
      archiveArtifacts 'info.json,wrap\\internal\\WireInternal-win32-ia32\\**'
    }
  }

  if(production) {
    stage('Upload build as draft to GitHub') {
      withCredentials([string(credentialsId: 'GITHUB_ACCESS_TOKEN', variable: 'GITHUB_ACCESS_TOKEN')]) {
        bat 'cd wrap\\prod\\Wire-win32-ia32\\ && python ..\\..\\..\\bin\\github_draft.py'
      }
    }
  }

  wireSend secret: "${jenkinsbot_secret}", message: " **New build of ${JOB_NAME} ${version} available for download on** ${JOB_URL}"
}
