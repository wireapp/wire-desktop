@NonCPS
def parseJson(def text) {
  new groovy.json.JsonSlurperClassic().parseText(text)
}

node('node160') {

  def production = params.PRODUCTION
  def custom = params.CUSTOM

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
  currentBuild.displayName = version

  stage('Build') {
    try {
      bat 'pip install -r jenkins/requirements.txt'
      def NODE = tool name: 'node-v10.15.3-windows-x86', type: 'nodejs'
      withEnv(["PATH+NODE=${NODE}", 'npm_config_target_arch=ia32', 'wire_target_arch=ia32']) {
        bat 'node -v'
        bat 'npm -v'
        bat 'npm install -g yarn'
        bat 'set "VSCMD_START_DIR=%CD%" & "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Community\\Common7\\Tools\\VsDevCmd.bat" & yarn'
        withCredentials([string(credentialsId: 'RAYGUN_API_KEY', variable: 'RAYGUN_API_KEY')]) {
          if (production) {
            bat 'yarn build:win'
          } else if (custom) {
            bat 'yarn build:win:custom'
          } else {
            bat 'yarn build:win:internal'
          }
        }
      }
    } catch(e) {
      currentBuild.result = 'FAILED'
      wireSend secret: "${jenkinsbot_secret}", message: "🏞 **${JOB_NAME} ${version} build failed** see: ${JOB_URL}"
      throw e
    }
  }

  stage('Sign build') {
    try {
      if (production) {
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\build\\Wire-win32-ia32\\Squirrel.exe"'
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\build\\Wire-win32-ia32\\Wire.exe"'
      } else if (custom) {
        bat 'for /d %%d in ("wrap\\build\\*-win32-ia32") do for %%f in ("%%d\\*.exe") do "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "%%f"'
      } else {
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\build\\WireInternal-win32-ia32\\Squirrel.exe"'
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\build\\WireInternal-win32-ia32\\WireInternal.exe"'
      }
    } catch(e) {
      currentBuild.result = 'FAILED'
      wireSend secret: "${jenkinsbot_secret}", message: "🏞 **${JOB_NAME} ${version} signing failed** see: ${JOB_URL}"
      throw e
    }
  }

  stage('Build installer') {
    try {
      def NODE = tool name: 'node-v10.15.3-windows-x86', type: 'nodejs'
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
      wireSend secret: "${jenkinsbot_secret}", message: "🏞 **${JOB_NAME} ${version} building installer failed** see: ${JOB_URL}"
      throw e
    }
  }

  stage('Sign installer') {
    try {
      if (production) {
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\prod\\Wire-win32-ia32\\WireSetup.exe"'
      } else if (custom) {
        bat 'for /d %%d in ("wrap\\build\\*-win32-ia32") do for %%f in ("%%d\\*-Setup.exe") do "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "%%f"'
      } else {
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\internal\\WireInternal-win32-ia32\\WireInternalSetup.exe"'
      }
    } catch(e) {
      currentBuild.result = 'FAILED'
      wireSend secret: "${jenkinsbot_secret}", message: "🏞 **${JOB_NAME} ${version} signing installer failed** see: ${JOB_URL}"
      throw e
    }
  }

  stage('Archive build artifacts') {
    if (production) {
      archiveArtifacts 'wrap\\prod\\Wire-win32-ia32\\**'
    } else if (custom) {
      archiveArtifacts 'wrap\\custom\\*-win32-ia32\\**'
    } else {
      archiveArtifacts 'wrap\\internal\\WireInternal-win32-ia32\\**'
    }
  }

  wireSend secret: "${jenkinsbot_secret}", message: "🏞 **New build of ${JOB_NAME} ${version} available for download on** ${JOB_URL}"
}
