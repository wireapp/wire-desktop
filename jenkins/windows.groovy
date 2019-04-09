@NonCPS
def parseJson(def text) {
  new groovy.json.JsonSlurperClassic().parseText(text)
}

node('node130') {
  def production = params.PRODUCTION
  def custom = params.CUSTOM
  def NODE = tool name: 'node-v10.15.3-windows-x86', type: 'nodejs'

  def jenkinsbot_secret = ''
  withCredentials([string(credentialsId: "${params.JENKINSBOT_SECRET}", variable: 'JENKINSBOT_SECRET')]) {
    jenkinsbot_secret = env.JENKINSBOT_SECRET
  }

  if (!production && !custom) {
    env.APP_ENV = 'internal'
  }

  stage('Checkout & Clean') {
    git branch: "${GIT_BRANCH}", url: 'https://github.com/wireapp/wire-desktop.git'
    bat returnStatus: true, script: 'rmdir /s /q "node_modules"'
    bat returnStatus: true, script: 'rmdir /s /q "electron\\node_modules"'
  }

  def text = readFile('electron/wire.json')
  def buildInfo = parseJson(text)
  def version = buildInfo.version.getAt(0..2) + '.' + env.BUILD_NUMBER
  currentBuild.displayName = version

  stage('Build') {
    try {
      withEnv(["PATH+NODE=${NODE}", 'npm_config_target_arch=ia32', 'wire_target_arch=ia32']) {
        bat 'node -v'
        bat 'npm -v'
        bat 'npm install -g yarn'
        bat 'set "VSCMD_START_DIR=%CD%" & "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Community\\Common7\\Tools\\VsDevCmd.bat" & yarn'
        withCredentials([string(credentialsId: 'RAYGUN_API_KEY', variable: 'RAYGUN_API_KEY')]) {
          bat 'yarn build:win'
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
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\build\\Wire-win32-ia32\\Update.exe"'
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\build\\Wire-win32-ia32\\Wire.exe"'
      } else if (custom) {
        bat 'for /d %%d in ("wrap\\build\\*-win32-ia32") do for %%f in ("%%d\\*.exe") do "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "%%f"'
      } else {
        bat '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "wrap\\build\\WireInternal-win32-ia32\\Update.exe"'
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
      withEnv(["PATH+NODE=${NODE}",'npm_config_target_arch=ia32','wire_target_arch=ia32']) {
        bat 'node build/windows-installer.js'
      }
    } catch(e) {
      currentBuild.result = 'FAILED'
      wireSend secret: "${jenkinsbot_secret}", message: "🏞 **${JOB_NAME} ${version} building installer failed** see: ${JOB_URL}"
      throw e
    }
  }

  stage('Sign installer') {
    try {
      bat 'for %%f in ("wrap\\dist\\*-Setup.exe") do "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe" sign /t http://timestamp.digicert.com /fd SHA256 /a "%%f"'
    } catch(e) {
      currentBuild.result = 'FAILED'
      wireSend secret: "${jenkinsbot_secret}", message: "🏞 **${JOB_NAME} ${version} signing installer failed** see: ${JOB_URL}"
      throw e
    }
  }

  stage('Archive build artifacts') {
    archiveArtifacts 'wrap\\dist\\**'
  }

  stage('Trigger smoke tests') {
    if (production) {
      try {
        build job: 'Wrapper_Windows_Smoke_Tests', parameters: [run(description: '', name: 'WRAPPER_BUILD', runId: "Wrapper_Windows_Production#${BUILD_ID}"), string(name: 'WEBAPP_ENV', value: 'https://wire-webapp-rc.zinfra.io/')], wait: false
      } catch(e) {
        wireSend secret: "${jenkinsbot_secret}", message: "🏞 **${JOB_NAME} Unable to trigger smoke tests for ${version}** see: ${JOB_URL}"
      }
    }
  }

  wireSend secret: "${jenkinsbot_secret}", message: "🏞 **New build of ${JOB_NAME} ${version} available for download on** ${JOB_URL}"
}
