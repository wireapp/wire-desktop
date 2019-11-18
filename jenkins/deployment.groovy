/*
Use the following Groovy script in the Extended Choice Parameter with , as delimiter:

def list = []
jobs = jenkins.getAllItems()
jobs.each { job ->
  name = job.fullName
  if (name.contains('Windows Internal') || name.contains('Wrapper_Linux') || name.contains('Wrapper_macOS')) {
  builds = job.builds
  for (i = 0; i <5; i++) {
    lastbuild = job.builds[i]
    if (lastbuild) {
    list << name + '#' + lastbuild.displayName
    }
  }
  }
}
return list

Add additional choice parameter "Release" with:
Internal
Production
Custom (needs special env variables)
*/
node('master') {
  def jenkinsbot_secret = ''
  withCredentials([string(credentialsId: 'JENKINSBOT_WRAPPER_CHAT', variable: 'JENKINSBOT_SECRET')]) {
    jenkinsbot_secret = env.JENKINSBOT_SECRET
  }

  stage('Checkout & Clean') {
    git branch: GIT_BRANCH, url: 'https://github.com/wireapp/wire-desktop.git'
    sh returnStatus: true, script: 'rm -rf *.pkg *.zip'
  }

  def projectName = params.WRAPPER_BUILD.tokenize('#')[0]
  def version = params.WRAPPER_BUILD.tokenize('#')[1]
  def (MAJOR_VERSION, MINOR_VERSION, BUILD_VERSION) = version.tokenize('.')
  def NODE = tool name: 'node-v12.13.0', type: 'nodejs'
  def DRY_RUN = params.DRY_RUN ? "--dry-run" : ""

  stage('Get build artifacts') {
    try {
      step ([
        $class: 'CopyArtifact',
        filter: 'wrap/build/**,wrap/dist/**',
        projectName: projectName,
        selector: [
          $class: 'SpecificBuildSelector',
          buildNumber: version
        ]
      ]);
    } catch (e) {
      // wireSend secret: jenkinsbot_secret, message: "**Could not get build artifacts of ${version} from ${projectName}** see: ${JOB_URL}"
      throw e
    }
  }

  currentBuild.displayName = "Deploy ${projectName} ${version}"

  stage('Install dependencies') {
    try {
      withEnv(["PATH+NODE=${NODE}/bin"]) {
        sh 'node -v'
        sh 'npm -v'
        sh 'npm install -g yarn appcenter-cli'
        sh 'yarn --ignore-scripts'
        sh "appcenter telemetry off"
      }
    } catch (e) {
      // wireSend secret: jenkinsbot_secret, message: "**Could not get build artifacts of ${version} from ${projectName}** see: ${JOB_URL}"
      throw e
    }
  }

  stage('Upload to S3 and/or AppCenter') {
    withEnv(["PATH+NODE=${NODE}/bin"]) {
      def SEARCH_PATH = './wrap/dist/'
      def APPCENTER_ACCOUNT_NAME = 'Account-Manager-Organization'
      def APPCENTER_APP_ID = params.APPCENTER_APP_ID
      def APPCENTER_APP_SECRET = ''
      def FILE_PATH = ''

      withCredentials([string(credentialsId: 'APPCENTER_TOKEN', variable: 'APPCENTER_TOKEN')]) {
        sh "appcenter login --token \"${env.APPCENTER_TOKEN}\""
      }

      if (projectName.contains('Windows')) {
        try {
          def AWS_ACCESS_KEY_ID = ''
          def AWS_SECRET_ACCESS_KEY = ''

          def S3_BUCKET = 'wire-taco'
          def S3_PATH = ''

          withCredentials([
            string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
            string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
          ]) {
            AWS_ACCESS_KEY_ID = env.AWS_ACCESS_KEY_ID
            AWS_SECRET_ACCESS_KEY = env.AWS_SECRET_ACCESS_KEY
          }

          if (params.Release.equals('Production')) {
            withCredentials([string(credentialsId: 'WIN_PROD_APPCENTER_SECRET', variable: 'WIN_PROD_APPCENTER_SECRET')]) {
              APPCENTER_APP_SECRET = env.WIN_PROD_APPCENTER_SECRET
            }
            S3_PATH = 'win/prod'
            FILE_PATH = './wrap/dist/Wire-Setup.exe'
          } else if (params.Release.equals('Custom')) {
            withCredentials([
              string(credentialsId: params.AWS_CUSTOM_ACCESS_KEY_ID, variable: 'AWS_CUSTOM_ACCESS_KEY_ID'),
              string(credentialsId: params.AWS_CUSTOM_SECRET_ACCESS_KEY, variable: 'AWS_CUSTOM_SECRET_ACCESS_KEY'),
              string(credentialsId: params.WIN_CUSTOM_APPCENTER_SECRET, variable: 'WIN_CUSTOM_APPCENTER_SECRET')
            ]) {
              AWS_ACCESS_KEY_ID = env.AWS_CUSTOM_ACCESS_KEY_ID
              AWS_SECRET_ACCESS_KEY = env.AWS_CUSTOM_SECRET_ACCESS_KEY
              APPCENTER_APP_SECRET = env.WIN_CUSTOM_APPCENTER_SECRET
            }
            S3_BUCKET = params.WIN_S3_BUCKET
            S3_PATH = params.WIN_S3_PATH
            FILE_PATH = params.FILE_PATH
          } else {
            // internal
            withCredentials([
              string(credentialsId: 'WIN_INTERNAL_APPCENTER_SECRET', variable: 'WIN_INTERNAL_APPCENTER_SECRET')
            ]) {
              APPCENTER_APP_SECRET = env.WIN_INTERNAL_APPCENTER_SECRET
            }
            S3_PATH = 'win/internal'
            FILE_PATH = './wrap/dist/WireInternal-Setup.exe'
          }
        } catch(e) {
          currentBuild.result = 'FAILED'
          // wireSend secret: jenkinsbot_secret, message: "**Setting environment variables failed for ${version}** see: ${JOB_URL}"
          throw e
        }

        parallel appcenter: {
          try {
            sh """appcenter distribute release
                  --app \"${APPCENTER_ACCOUNT_NAME}/${APPCENTER_APP_ID}\"
                  --build-number \"${BUILD_VERSION}\"
                  --build-version \"${MAJOR_VERSION}.${MINOR_VERSION}\"
                  --file \"${FILE_PATH}\"
                  --group \"Collaborators\"
                  --release-notes \"Jenkins Build\""""
          } catch(e) {
            currentBuild.result = 'FAILED'
            // wireSend secret: jenkinsbot_secret, message: "**Deploying to AppCenter failed for ${version}** see: ${JOB_URL}"
            throw e
          }
        }, s3: {
          try {
            sh """jenkins/ts-node.sh ./bin/deploy-tools/s3-cli.ts
                                     --bucket \"${S3_BUCKET}\"
                                     --key-id \"${AWS_ACCESS_KEY_ID}\"
                                     --path \"${SEARCH_PATH}\"
                                     --s3path \"${S3_PATH}\"
                                     --secret-key \"${AWS_SECRET_ACCESS_KEY}\"
                                     --wrapper-build \"${WRAPPER_BUILD}\"
                                     ${DRY_RUN}"""
          } catch(e) {
            currentBuild.result = 'FAILED'
            // wireSend secret: jenkinsbot_secret, message: "**Deploying to S3 failed for ${version}** see: ${JOB_URL}"
            throw e
          }
        }, failFast: true
      } else if (projectName.contains('macOS')) {
        try {
          if (params.Release.equals('Production')) {
            withCredentials([
              string(credentialsId: 'MACOS_MAS_APPCENTER_SECRET', variable: 'MACOS_MAS_APPCENTER_SECRET')
            ]) {
              APPCENTER_APP_SECRET = env.MACOS_MAS_APPCENTER_SECRET
            }
            FILE_PATH = './wrap/dist/Wire.pkg'
          } else if (params.Release.equals('Custom')) {
            withCredentials([
              string(credentialsId: params.MACOS_CUSTOM_APPCENTER_SECRET, variable: 'MACOS_CUSTOM_APPCENTER_SECRET')
            ]) {
              APPCENTER_APP_SECRET = env.MACOS_CUSTOM_APPCENTER_SECRET
            }
            FILE_PATH = params.FILE_PATH
          } else {
            // internal
            withCredentials([
              string(credentialsId: 'MACOS_INTERNAL_APPCENTER_SECRET', variable: 'MACOS_INTERNAL_APPCENTER_SECRET')
            ]) {
              APPCENTER_APP_SECRET = env.MACOS_INTERNAL_APPCENTER_SECRET
            }
            FILE_PATH = './wrap/dist/WireInternal.zip'
            zip "${FILE_PATH}" './wrap/build/WireInternal-mas-x64/WireInternal.app'
          }

          sh """appcenter distribute release
                --app \"${APPCENTER_ACCOUNT_NAME}/${APPCENTER_APP_ID}\"
                --build-number \"${BUILD_VERSION}\"
                --build-version \"${MAJOR_VERSION}.${MINOR_VERSION}\"
                --file \"${FILE_PATH}\"
                --group \"Collaborators\"
                --release-notes \"Jenkins Build\""""
        } catch(e) {
          currentBuild.result = 'FAILED'
          // wireSend secret: jenkinsbot_secret, message: "**Deploying to AppCenter failed for ${version}** see: ${JOB_URL}"
          throw e
        }
      } else if (projectName.contains('Linux')) {
        try {
          if (params.Release.equals('Production')) {
            withCredentials([
              string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
              string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
            ]) {
              sh """jenkins/ts-node.sh ./bin/deploy-tools/s3-cli.ts
                                       --bucket \"wire-taco\"
                                       --key-id \"${env.AWS_ACCESS_KEY_ID}\"
                                       --path \"${SEARCH_PATH}\"
                                       --s3path \"linux\"
                                       --secret-key \"${env.AWS_SECRET_ACCESS_KEY}\"
                                       --wrapper-build \"${WRAPPER_BUILD}\"
                                       ${DRY_RUN}"""
            }
          } else if (params.Release.equals('Custom')) {
            // do nothing
          } else {
            // Linux is currently not supported by AppCenter
          }
        } catch(e) {
          currentBuild.result = 'FAILED'
          // wireSend secret: jenkinsbot_secret, message: "**Deploying to AppCenter failed for ${version}** see: ${JOB_URL}"
          throw e
        }
      }
    }
  }

  if (projectName.contains('Windows')) {
    stage('Update RELEASES file') {
      try {
        withEnv(["PATH+NODE=${NODE}/bin"]) {
          def AWS_ACCESS_KEY_ID = ''
          def AWS_SECRET_ACCESS_KEY = ''
          def S3_BUCKET = 'wire-taco'
          def S3_PATH = ''
          def SEARCH_PATH = './wrap/dist/'

          withCredentials([
            string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
            string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
          ]) {
            AWS_ACCESS_KEY_ID = env.AWS_ACCESS_KEY_ID
            AWS_SECRET_ACCESS_KEY = env.AWS_SECRET_ACCESS_KEY
          }

          if (params.Release.equals('Production')) {
            S3_PATH = 'win/prod'
          } else if (params.Release.equals('Custom')) {
            withCredentials([
              string(credentialsId: params.AWS_CUSTOM_ACCESS_KEY_ID, variable: 'AWS_ACCESS_KEY_ID'),
              string(credentialsId: params.AWS_CUSTOM_SECRET_ACCESS_KEY, variable: 'AWS_SECRET_ACCESS_KEY')
            ]) {
              AWS_ACCESS_KEY_ID = env.AWS_ACCESS_KEY_ID
              AWS_SECRET_ACCESS_KEY = env.AWS_SECRET_ACCESS_KEY
            }
            S3_PATH = params.WIN_S3_PATH
            S3_BUCKET = params.WIN_S3_BUCKET
          } else {
            S3_PATH = 'win/internal'
          }

          sh """jenkins/ts-node.sh ./bin/deploy-tools/s3-win-releases-cli.ts
                                   --bucket \"${S3_BUCKET}\"
                                   --key-id \"${AWS_ACCESS_KEY_ID}\"
                                   --path \"${SEARCH_PATH}\"
                                   --s3path \"${S3_PATH}\"
                                   --secret-key \"${AWS_SECRET_ACCESS_KEY}\"
                                   --wrapper-build \"${WRAPPER_BUILD}\"
                                   ${DRY_RUN}"""
        }
      } catch(e) {
        currentBuild.result = 'FAILED'
        // wireSend secret: jenkinsbot_secret, message: "**Changing RELEASES file failed for ${version}** see: ${JOB_URL}"
        throw e
      }
    }
  }

  if (params.Release.equals('Production')) {
    stage('Upload build as draft to GitHub') {
      try {
        withEnv(["PATH+NODE=${NODE}/bin"]) {
          def SEARCH_PATH = './wrap/dist/'

          withCredentials([string(credentialsId: 'GITHUB_ACCESS_TOKEN', variable: 'GITHUB_ACCESS_TOKEN')]) {
            sh """jenkins/ts-node.sh ./bin/deploy-tools/github-draft-cli.ts
                                     --github-token \"${env.GITHUB_ACCESS_TOKEN}\"
                                     --path \"${SEARCH_PATH}\"
                                     --wrapper-build \"${WRAPPER_BUILD}\"
                                     ${DRY_RUN}"""
          }
        }
      } catch(e) {
        currentBuild.result = 'FAILED'
        // wireSend secret: jenkinsbot_secret, message: "**Upload build as draft to GitHub failed for ${version}** see: ${JOB_URL}"
        throw e
      }
    }
  }
}
