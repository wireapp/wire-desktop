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
    git branch: "${GIT_BRANCH}", url: 'https://github.com/wireapp/wire-desktop.git'
    sh returnStatus: true, script: 'rm -rf *.pkg *.zip'
  }

  def projectName = env.WRAPPER_BUILD.tokenize('#')[0]
  def version = env.WRAPPER_BUILD.tokenize('#')[1]
  def NODE = tool name: 'node-v10.15.3', type: 'nodejs'

  stage('Get build artifacts') {
    try {
      step ([
        $class: 'CopyArtifact',
        filter: 'wrap/build/**',
        projectName: "$projectName",
        selector: [
          $class: 'SpecificBuildSelector',
          buildNumber: "$version"
        ]
      ]);
    } catch (e) {
      wireSend secret: "$jenkinsbot_secret", message: "**Could not get build artifacts from of ${version} from ${projectName}** see: ${JOB_URL}"
      throw e
    }
  }

  currentBuild.displayName = "Deploy ${projectName} ${version}"

  stage('Install dependencies') {
    try {
      withEnv(["PATH+NODE=${NODE}/bin"]) {
        sh 'node -v'
        sh 'npm -v'
        sh 'npm install -g yarn'
        sh 'yarn --ignore-scripts'
      }
    } catch (e) {
      wireSend secret: "$jenkinsbot_secret", message: "**Could not get build artifacts of ${version} from ${projectName}** see: ${JOB_URL}"
      throw e
    }
  }

  stage('Upload to S3 and/or Hockey') {
    withEnv(["PATH+NODE=${NODE}/bin"]) {
      if (projectName.contains('Windows')) {
        try {
          def AWS_ACCESS_KEY_ID = ''
          def AWS_SECRET_ACCESS_KEY = ''
          def WIN_HOCKEY_ID = ''
          def WIN_HOCKEY_TOKEN = ''
          def S3_BUCKET = 'wire-taco'
          def S3_PATH = ''
          def SEARCH_PATH = './wrap/dist/'

          withCredentials([
            string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID')],
            string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY'),
          ]) {
            AWS_ACCESS_KEY_ID = env.AWS_ACCESS_KEY_ID
            AWS_SECRET_ACCESS_KEY = env.AWS_SECRET_ACCESS_KEY
          }

          if (params.Release.equals('Production')) {
            withCredentials([
              string(credentialsId: 'WIN_PROD_HOCKEY_ID', variable: 'WIN_PROD_HOCKEY_ID'),
              string(credentialsId: 'WIN_PROD_HOCKEY_TOKEN', variable: 'WIN_PROD_HOCKEY_TOKEN')
            ]) {
              WIN_HOCKEY_ID = env.WIN_PROD_HOCKEY_ID
              WIN_HOCKEY_TOKEN = env.WIN_PROD_HOCKEY_TOKEN
            }
            S3_PATH = 'win/prod'
          } else if (params.Release.equals('Custom')) {
            withCredentials([
              string(credentialsId: "${params.AWS_CUSTOM_ACCESS_KEY_ID}", variable: 'AWS_CUSTOM_ACCESS_KEY_ID'),
              string(credentialsId: "${params.AWS_CUSTOM_SECRET_ACCESS_KEY}", variable: 'AWS_CUSTOM_SECRET_ACCESS_KEY'),
              string(credentialsId: "${params.WIN_CUSTOM_HOCKEY_ID}", variable: 'WIN_CUSTOM_HOCKEY_ID'),
              string(credentialsId: "${params.WIN_CUSTOM_HOCKEY_TOKEN}", variable: 'WIN_CUSTOM_HOCKEY_TOKEN')
            ]) {
              AWS_ACCESS_KEY_ID = env.AWS_CUSTOM_ACCESS_KEY_ID
              AWS_SECRET_ACCESS_KEY = env.AWS_CUSTOM_SECRET_ACCESS_KEY
              WIN_HOCKEY_ID = env.WIN_CUSTOM_HOCKEY_ID
              WIN_HOCKEY_TOKEN = env.WIN_CUSTOM_HOCKEY_TOKEN
            }
            S3_BUCKET = "${params.WIN_S3_BUCKET}"
            S3_PATH = "${params.WIN_S3_PATH}"
          } else {
            withCredentials([
              string(credentialsId: 'WIN_HOCKEY_ID', variable: 'WIN_HOCKEY_ID',
              string(credentialsId: 'WIN_HOCKEY_TOKEN', variable: 'WIN_HOCKEY_TOKEN')
            ]) {
              WIN_HOCKEY_ID = env.WIN_HOCKEY_ID
              WIN_HOCKEY_TOKEN = env.WIN_HOCKEY_TOKEN
            }
            S3_PATH = 'win/internal'
          }
        } catch(e) {
          currentBuild.result = 'FAILED'
          wireSend secret: "$jenkinsbot_secret", message: "**Setting environment variables failed for ${version}** see: ${JOB_URL}"
          throw e
        }

        parallel hockey: {
          try {
            sh "npx wire-deploy-hockey --hockey-id \"${WIN_HOCKEY_ID}\" --hockey-token \"${WIN_HOCKEY_TOKEN}\" --wrapper-build \"${WRAPPER_BUILD}\" --path \"${SEARCH_PATH}\""
          } catch(e) {
            currentBuild.result = 'FAILED'
            wireSend secret: "$jenkinsbot_secret", message: "**Deploying to Hockey failed for ${version}** see: ${JOB_URL}"
            throw e
          }
        }, s3: {
          try {
            sh "npx wire-deploy-s3 --bucket \"${S3_BUCKET}\" --s3-path \"${S3_PATH}\" --key-id \"${AWS_ACCESS_KEY_ID}\" --secret-key \"${AWS_SECRET_ACCESS_KEY}\"  --wrapper-build \"${WRAPPER_BUILD}\" --path ./wrap/dist"
          } catch(e) {
            currentBuild.result = 'FAILED'
            wireSend secret: "$jenkinsbot_secret", message: "**Deploying to S3 failed for ${version}** see: ${JOB_URL}"
            throw e
          }
        }, failFast: true
      } else if (projectName.contains('macOS')) {
        try {
          def MACOS_HOCKEY_ID = ''
          def MACOS_HOCKEY_TOKEN = ''

          if (params.Release.equals('Production')) {
            withCredentials([
              string(credentialsId: 'MACOS_MAS_HOCKEY_ID', variable: 'MACOS_MAS_HOCKEY_ID'),
              string(credentialsId: 'MACOS_MAS_HOCKEY_TOKEN', variable: 'MACOS_MAS_HOCKEY_TOKEN')
            ]) {
              MACOS_HOCKEY_ID = env.MACOS_MAS_HOCKEY_ID
              MACOS_HOCKEY_TOKEN = env.MACOS_MAS_HOCKEY_TOKEN
            }
          } else if (params.Release.equals('Custom')) {
            withCredentials([
              string(credentialsId: "${params.MACOS_CUSTOM_HOCKEY_ID}", variable: 'MACOS_CUSTOM_HOCKEY_ID'),
              string(credentialsId: "${params.MACOS_CUSTOM_HOCKEY_TOKEN}", variable: 'MACOS_CUSTOM_HOCKEY_TOKEN')
            ]) {
              MACOS_HOCKEY_ID = env.MACOS_CUSTOM_HOCKEY_ID
              MACOS_HOCKEY_TOKEN = env.MACOS_CUSTOM_HOCKEY_TOKEN
            }
          } else {
            withCredentials([string(credentialsId: 'MACOS_HOCKEY_ID', variable: 'MACOS_HOCKEY_ID'), string(credentialsId: 'MACOS_HOCKEY_TOKEN', variable: 'MACOS_HOCKEY_TOKEN')]) {
              MACOS_HOCKEY_ID = env.MACOS_HOCKEY_ID
              MACOS_HOCKEY_TOKEN = env.MACOS_HOCKEY_TOKEN
            }
          }

          sh "npx wire-deploy-hockey --hockey-id \"${MACOS_HOCKEY_ID}\" --hockey-token \"${MACOS_HOCKEY_TOKEN}\" --wrapper-build \"${WRAPPER_BUILD}\" --path ."
        } catch(e) {
          currentBuild.result = 'FAILED'
          wireSend secret: "$jenkinsbot_secret", message: "**Deploying to Hockey failed for ${version}** see: ${JOB_URL}"
          throw e
        }
      } else if (projectName.contains('Linux')) {
        try {
          if (params.Release.equals('Production')) {
            withCredentials([
              string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
              string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
            ]) {
              sh "npx wire-deploy-s3 --bucket wire-taco --s3path linux --key-id \"${env.AWS_ACCESS_KEY_ID}\" --secret-key \"${env.AWS_SECRET_ACCESS_KEY}\" --wrapper-build \"${WRAPPER_BUILD}\" --path ./wrap/dist"
            }

          } else if (params.Release.equals('Custom')) {
            // do nothing
          } else {
            withCredentials([
              string(credentialsId: 'LINUX_HOCKEY_ID', variable: 'LINUX_HOCKEY_ID'),
              string(credentialsId: 'LINUX_HOCKEY_TOKEN', variable: 'LINUX_HOCKEY_TOKEN')
            ]) {
              sh "npx wire-deploy-hockey --hockey-id \"${env.LINUX_HOCKEY_ID}\" --hockey-token \"${env.LINUX_HOCKEY_TOKEN}\" --wrapper-build \"${WRAPPER_BUILD}\" --path ./wrap/dist"
            }
          }
        } catch(e) {
          currentBuild.result = 'FAILED'
          wireSend secret: "$jenkinsbot_secret", message: "**Deploying to Hockey failed for ${version}** see: ${JOB_URL}"
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
              string(credentialsId: "${params.AWS_CUSTOM_ACCESS_KEY_ID}", variable: 'AWS_ACCESS_KEY_ID'),
              string(credentialsId: "${params.AWS_CUSTOM_SECRET_ACCESS_KEY}", variable: 'AWS_SECRET_ACCESS_KEY')
            ]) {
              AWS_ACCESS_KEY_ID = env.AWS_ACCESS_KEY_ID
              AWS_SECRET_ACCESS_KEY = env.AWS_SECRET_ACCESS_KEY
            }
            S3_PATH = "${params.WIN_S3_PATH}"
            S3_BUCKET = "${params.WIN_S3_BUCKET}"
          } else {
            S3_PATH = 'win/internal'
          }

          sh "npx wire-deploy-s3-win-releases --bucket \"${S3_BUCKET}\" --s3path \"${S3_PATH}\" --key-id \"${AWS_ACCESS_KEY_ID}\" --secret-key \"${AWS_SECRET_ACCESS_KEY}\"  --wrapper-build \"${WRAPPER_BUILD}\" --path \"${SEARCH_PATH}\""
        }
      } catch(e) {
        currentBuild.result = 'FAILED'
        wireSend secret: "$jenkinsbot_secret", message: "**Changing RELEASES file failed for ${version}** see: ${JOB_URL}"
        throw e
      }
    }
  }

  if (params.Release.equals('Production')) {
    stage('Upload build as draft to GitHub') {
      try {
        withEnv(["PATH+NODE=${NODE}/bin"]) {
          def SEARCH_PATH = './wrap/dist/'

          if (projectName.contains('macOS')) {
            SEARCH_PATH = '.'
          }

          withCredentials([string(credentialsId: 'GITHUB_ACCESS_TOKEN', variable: 'GITHUB_ACCESS_TOKEN')]) {
            sh "npx wire-deploy-github-draft --github-token \"${env.GITHUB_ACCESS_TOKEN}\" --wrapper-build \"${WRAPPER_BUILD}\" --path \"${SEARCH_PATH}\""
          }
        }
      } catch(e) {
        currentBuild.result = 'FAILED'
        wireSend secret: "$jenkinsbot_secret", message: "**Upload build as draft to Github failed for ${version}** see: ${JOB_URL}"
        throw e
      }
    }
  }
}
