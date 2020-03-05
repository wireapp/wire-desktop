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
    sh returnStatus: true, script: 'rm -rf *.pkg *.zip ./wrap/dist/'
  }

  def projectName = env.WRAPPER_BUILD.tokenize('#')[0]
  def version = env.WRAPPER_BUILD.tokenize('#')[1]
  def NODE = tool name: 'node-v12.13.0', type: 'nodejs'
  def DRY_RUN = params.DRY_RUN ? "--dry-run" : ""

  stage('Get build artifacts') {
    try {
      step ([
        $class: 'CopyArtifact',
        filter: 'wrap/build/**,wrap/dist/**',
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

  stage('Upload to S3') {
    withEnv(["PATH+NODE=${NODE}/bin"]) {
      def SEARCH_PATH = './wrap/dist/'

      if (projectName.contains('Windows')) {
        def S3_PATH = ''
        def AWS_ACCESS_KEY_CREDENTIALS_ID = ''
        def AWS_SECRET_CREDENTIALS_ID = ''

          if (params.Release.equals('Production')) {
            S3_PATH = 'win/prod'
            AWS_ACCESS_KEY_CREDENTIALS_ID = 'AWS_ACCESS_KEY_ID'
            AWS_SECRET_CREDENTIALS_ID = 'AWS_SECRET_ACCESS_KEY'
          } else if (params.Release.equals('Internal')) {
            S3_PATH = 'win/internal'
            AWS_ACCESS_KEY_CREDENTIALS_ID = 'AWS_ACCESS_KEY_ID'
            AWS_SECRET_CREDENTIALS_ID = 'AWS_SECRET_ACCESS_KEY'
          } else if (params.Release.equals('Custom')) {
            S3_BUCKET = params.WIN_S3_BUCKET
            S3_PATH = params.WIN_S3_PATH
            AWS_ACCESS_KEY_CREDENTIALS_ID = params.AWS_CUSTOM_ACCESS_KEY_ID
            AWS_SECRET_CREDENTIALS_ID = params.AWS_CUSTOM_SECRET_ACCESS_KEY
          }

        try {
          withCredentials([
            string(credentialsId: AWS_ACCESS_KEY_CREDENTIALS_ID, variable: 'AWS_ACCESS_KEY_ID'),
            string(credentialsId: AWS_SECRET_CREDENTIALS_ID, variable: 'AWS_SECRET_ACCESS_KEY')
          ]) {
            sh "jenkins/ts-node.sh ./bin/deploy-tools/s3-cli.ts --bucket \"${S3_BUCKET}\" --s3path \"${S3_PATH}\" --key-id \"${AWS_ACCESS_KEY_ID}\" --secret-key \"${AWS_SECRET_ACCESS_KEY}\" --wrapper-build \"${WRAPPER_BUILD}\" --path \"${SEARCH_PATH}\" ${DRY_RUN}"
          }
        } catch(e) {
          currentBuild.result = 'FAILED'
          wireSend secret: "$jenkinsbot_secret", message: "**Deploying to S3 failed for ${version}** see: ${JOB_URL}"
          throw e
        }
      } else if (projectName.contains('macOS')) {
        try {
          def appName
          def distributionGroups

          if (params.Release.equals('Production')) {
            appName = 'Wire-macOS-Production'
          } else if (params.Release.equals('Custom')) {
            appName = 'Wire by XY - macOS'
          } else if (params.Release.equals('Internal')) {
            appName = 'Wire-macOS-Internal'
            distributionGroups = 'All-users-of-Wire-macOS-Internal'
          }

          withCredentials([usernamePassword(credentialsId: 'appCenterCredentials', passwordVariable: 'APP_CENTER_TOKEN', usernameVariable: 'APP_CENTER_OWNER_NAME')]) {
            files = findFiles(glob: 'wrap/dist/*.zip')
            echo("Upload " + files[0].path + " as " + appName + " to App Center...")
            appCenter apiToken: env.APP_CENTER_TOKEN, appName: appName, distributionGroups: distributionGroups, ownerName: env.APP_CENTER_OWNER_NAME, pathToApp: files[0].path, releaseNotes: 'Uploaded by Jenkins deploy job'
          }
        } catch(e) {
          currentBuild.result = 'FAILED'
          wireSend secret: "$jenkinsbot_secret", message: "**Deploying to App Center failed for ${version}** see: ${JOB_URL}"
          throw e
        }
      } else if (projectName.contains('Linux')) {
        try {
          if (params.Release.equals('Production')) {
            withCredentials([
              string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'),
              string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
            ]) {
              sh "jenkins/ts-node.sh ./bin/deploy-tools/s3-cli.ts --bucket wire-taco --s3path linux --key-id \"${env.AWS_ACCESS_KEY_ID}\" --secret-key \"${env.AWS_SECRET_ACCESS_KEY}\" --wrapper-build \"${WRAPPER_BUILD}\" --path \"${SEARCH_PATH}\" ${DRY_RUN}"
            }

          } else if (params.Release.equals('Custom')) {
            // do nothing
          } else {
            withCredentials([
              string(credentialsId: 'LINUX_HOCKEY_ID', variable: 'LINUX_HOCKEY_ID'),
              string(credentialsId: 'LINUX_HOCKEY_TOKEN', variable: 'LINUX_HOCKEY_TOKEN')
            ]) {
              sh "jenkins/ts-node.sh ./bin/deploy-tools/hockey-cli.ts --hockey-id \"${env.LINUX_HOCKEY_ID}\" --hockey-token \"${env.LINUX_HOCKEY_TOKEN}\" --wrapper-build \"${WRAPPER_BUILD}\" --path \"${SEARCH_PATH}\" ${DRY_RUN}"
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
          def S3_PATH = ''
          def SEARCH_PATH = './wrap/dist/'
          def AWS_ACCESS_KEY_CREDENTIALS_ID = ''
          def AWS_SECRET_CREDENTIALS_ID = ''

          if (params.Release.equals('Production')) {
            S3_PATH = 'win/prod'
            S3_NAME = 'wire-' + version
            AWS_ACCESS_KEY_CREDENTIALS_ID = 'AWS_ACCESS_KEY_ID'
            AWS_SECRET_CREDENTIALS_ID = 'AWS_SECRET_ACCESS_KEY'
          } else if (params.Release.equals('Internal')) {
            S3_PATH = 'win/internal'
            S3_NAME = 'wireinternal-' + version
            AWS_ACCESS_KEY_CREDENTIALS_ID = 'AWS_ACCESS_KEY_ID'
            AWS_SECRET_CREDENTIALS_ID = 'AWS_SECRET_ACCESS_KEY'
          } else if (params.Release.equals('Custom')) {
            S3_BUCKET = params.WIN_S3_BUCKET
            S3_PATH = params.WIN_S3_PATH
            S3_NAME = 'wire-ey-' + version
            AWS_ACCESS_KEY_CREDENTIALS_ID = params.AWS_CUSTOM_ACCESS_KEY_ID
            AWS_SECRET_CREDENTIALS_ID = params.AWS_CUSTOM_SECRET_ACCESS_KEY
          }

          withCredentials([
            string(credentialsId: AWS_ACCESS_KEY_CREDENTIALS_ID, variable: 'AWS_ACCESS_KEY_ID'),
            string(credentialsId: AWS_SECRET_CREDENTIALS_ID, variable: 'AWS_SECRET_ACCESS_KEY')
          ]) {
            withAWS(region:'eu-west-1', credentials: 'wire-taco') {
              echo('Delete old RELEASE file and setup executable')
              s3Delete bucket: S3_BUCKET, path: S3_PATH + '/RELEASES'
              files = findFiles(glob: 'wrap/dist/*Setup.exe')
              s3Delete bucket: S3_BUCKET, path: S3_PATH + '/' + files[0].name

              echo('Copy new RELEASE file and setup executable to default position')
              s3Copy acl: 'PublicRead', fromBucket: S3_BUCKET, fromPath: S3_PATH + '/' + S3_NAME + '-RELEASES',toBucket: S3_BUCKET, toPath: S3_PATH + '/RELEASES'
              s3Copy acl: 'PublicRead', fromBucket: S3_BUCKET, fromPath: S3_PATH + '/' + S3_NAME + '.exe',toBucket: S3_BUCKET, toPath: S3_PATH + '/' + files[0].name
            }
          }
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

          withCredentials([string(credentialsId: 'GITHUB_ACCESS_TOKEN', variable: 'GITHUB_ACCESS_TOKEN')]) {
            sh "jenkins/ts-node.sh ./bin/deploy-tools/github-draft-cli.ts --github-token \"${env.GITHUB_ACCESS_TOKEN}\" --wrapper-build \"${WRAPPER_BUILD}\" --path \"${SEARCH_PATH}\" ${DRY_RUN}"
          }
        }
      } catch(e) {
        currentBuild.result = 'FAILED'
        wireSend secret: "$jenkinsbot_secret", message: "**Upload build as draft to GitHub failed for ${version}** see: ${JOB_URL}"
        throw e
      }
    }
  }
}
