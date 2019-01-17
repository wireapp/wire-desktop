@NonCPS
def parseJson(def text) {
  new groovy.json.JsonSlurperClassic().parseText(text)
}

node('node160') {

  def production = params.PRODUCTION
  def custom = params.CUSTOM
  def app_base = params.APP_BASE
  def app_name = params.APP_NAME

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
      def NODE = tool name: 'node-v10.15.0-windows-x86', type: 'nodejs'
      withEnv(["PATH+NODE=${NODE}", 'npm_config_target_arch=ia32', 'wire_target_arch=ia32', "APP_BASE=${app_base}"]) {
        bat 'node -v'
        bat 'npm -v'
        bat 'npm install -g yarn'
        bat 'set "VSCMD_START_DIR=%CD%" & "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Community\\Common7\\Tools\\VsDevCmd.bat" & yarn'
        bat 'yarn build:ts'
        withCredentials([string(credentialsId: 'RAYGUN_API_KEY', variable: 'RAYGUN_API_KEY')]) {
          if (production) {
            bat 'npx grunt win-prod'
          } else if (custom) {
            bat 'npx grunt win-custom'
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
      if (production) {
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\build\\Wire-win32-ia32\\Update.exe"'
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\build\\Wire-win32-ia32\\Wire.exe"'
      } else if (custom) {
        bat "\"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe\" sign /t http://timestamp.digicert.com /fd SHA256 /a \"wrap\\build\\${app_name}-win32-ia32\\Update.exe\""
        bat "\"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe\" sign /t http://timestamp.digicert.com /fd SHA256 /a \"wrap\\build\\${app_name}-win32-ia32\\${app_name}.exe\""
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
      def NODE = tool name: 'node-v10.15.0-windows-x86', type: 'nodejs'
      withEnv(["PATH+NODE=${NODE}",'npm_config_target_arch=ia32','wire_target_arch=ia32']) {
        if (production) {
          bat 'npx grunt create-windows-installer:prod'
        } else if (custom) {
          bat 'npx grunt create-windows-installer:custom'
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
      if (production) {
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\prod\\Wire-win32-ia32\\WireSetup.exe"'
      } else if (custom) {
        bat "\"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe\" sign /t http://timestamp.digicert.com /fd SHA256 /a \"wrap\\custom\\${app_name}-win32-ia32\\${app_name}-Setup.exe\""
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
    if (production) {
      archiveArtifacts 'info.json,wrap\\prod\\Wire-win32-ia32\\**'
    } else if (custom) {
      archiveArtifacts "info.json,wrap\\custom\\${app_name}-win32-ia32\\**"
    } else {
      archiveArtifacts 'info.json,wrap\\internal\\WireInternal-win32-ia32\\**'
    }
  }

  wireSend secret: "${jenkinsbot_secret}", message: "**New build of ${JOB_NAME} ${version} available for download on** ${JOB_URL}"
}
