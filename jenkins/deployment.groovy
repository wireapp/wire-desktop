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
      step ([$class: 'CopyArtifact',
      projectName: "$projectName",
      selector: [$class: 'SpecificBuildSelector', buildNumber: "$version"],
      filter: '*.pkg,wrap/**']);
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
          def AWS_ACCESS_KEY_ID = credentials('AWS_ACCESS_KEY_ID')
          def AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')
          def HOCKEY_ID = ''
          def HOCKEY_TOKEN = ''
          def S3_BUCKET = 'wire-taco'
          def S3_PATH = ''
          def SEARCH_PATH = './wrap/dist/'

          if (params.Release.equals('Production')) {
            HOCKEY_ID = credentials('WIN_PROD_HOCKEY_ID')
            HOCKEY_TOKEN = credentials('WIN_PROD_HOCKEY_TOKEN')
            S3_PATH = 'win/prod'
          } else if (params.Release.equals('Custom')) {
            AWS_ACCESS_KEY_ID = credentials("${params.AWS_CUSTOM_ACCESS_KEY_ID}")
            AWS_SECRET_ACCESS_KEY = credentials("${params.AWS_CUSTOM_SECRET_ACCESS_KEY}")
            HOCKEY_ID = credentials("${params.WIN_CUSTOM_HOCKEY_ID}")
            HOCKEY_TOKEN = credentials("${params.WIN_CUSTOM_HOCKEY_TOKEN}")
            S3_BUCKET = "${params.WIN_S3_BUCKET}"
            S3_PATH = "${params.WIN_S3_PATH}"
          } else {
            HOCKEY_ID = credentials('WIN_HOCKEY_TOKEN')
            HOCKEY_TOKEN = credentials('WIN_HOCKEY_ID')
            S3_PATH = 'win/internal'
          }
        } catch(e) {
          currentBuild.result = 'FAILED'
          wireSend secret: "$jenkinsbot_secret", message: "**Setting environment variables failed for ${version}** see: ${JOB_URL}"
          throw e
        }

        parallel hockey: {
          try {
            sh "npx wire-deploy-hockey --hockey-id \"${HOCKEY_ID}\" --hockey-token \"${HOCKEY_TOKEN}\" --wrapper-build \"${WRAPPER_BUILD}\" --path \"${SEARCH_PATH}\""
          } catch(e) {
            currentBuild.result = 'FAILED'
            wireSend secret: "$jenkinsbot_secret", message: "**Deploying to Hockey failed for ${version}** see: ${JOB_URL}"
            throw e
          }
        }, s3: {
          try {
            sh "npx wire-deploy-s3 --bucket \"${S3_BUCKET}\" --s3-path \"${S3_PATH}\" --wrapper-build \"${WRAPPER_BUILD}\" --path ./wrap/dist"
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
            MACOS_HOCKEY_ID = credentials('MACOS_MAS_HOCKEY_ID')
            MACOS_HOCKEY_TOKEN = credentials('MACOS_MAS_HOCKEY_TOKEN')
          } else if (params.Release.equals('Custom')) {
            MACOS_HOCKEY_ID = credentials("${params.MACOS_CUSTOM_HOCKEY_ID}")
            MACOS_HOCKEY_TOKEN = credentials("${params.MACOS_CUSTOM_HOCKEY_TOKEN}")
          } else {
            MACOS_HOCKEY_ID = credentials('MACOS_HOCKEY_ID')
            MACOS_HOCKEY_TOKEN = credentials('MACOS_HOCKEY_TOKEN')
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
            def AWS_ACCESS_KEY_ID = credentials('AWS_ACCESS_KEY_ID')
            def AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')

            sh "npx wire-deploy-s3 --bucket wire-taco --s3path linux --wrapper-build \"${WRAPPER_BUILD}\" --path ./wrap/dist"
          } else if (params.Release.equals('Custom')) {
            // do nothing
          } else {
            def LINUX_HOCKEY_ID = credentials('LINUX_HOCKEY_ID')
            def LINUX_HOCKEY_TOKEN = credentials('LINUX_HOCKEY_TOKEN')

            sh "npx wire-deploy-hockey --hockey-id \"${LINUX_HOCKEY_ID}\" --hockey-token \"${LINUX_HOCKEY_TOKEN}\" --wrapper-build \"${WRAPPER_BUILD}\" --path ./wrap/dist"
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
          def AWS_ACCESS_KEY_ID = credentials('AWS_ACCESS_KEY_ID')
          def AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')
          def S3_BUCKET = 'wire-taco'
          def S3_PATH = ''
          def SEARCH_PATH = './wrap/dist/'

          if (params.Release.equals('Production')) {
            S3_PATH = 'win/prod'
          } else if (params.Release.equals('Custom')) {
            S3_PATH = "${params.WIN_S3_PATH}"
            S3_BUCKET = "${params.WIN_S3_BUCKET}"
            AWS_ACCESS_KEY_ID = credentials("${params.AWS_CUSTOM_ACCESS_KEY_ID}")
            AWS_SECRET_ACCESS_KEY = credentials("${params.AWS_CUSTOM_SECRET_ACCESS_KEY}")
          } else {
            S3_PATH = 'win/internal'
          }

          sh "npx wire-deploy-s3-win-releases --bucket \"${S3_BUCKET}\" --path \"${S3_PATH}\" --wrapper-build \"${WRAPPER_BUILD}\" --path \"${SEARCH_PATH}\""
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
          def SEARCH_PATH = 'wrap/dist/'
          def GITHUB_ACCESS_TOKEN = credentials('GITHUB_ACCESS_TOKEN')

          if (projectName.contains('macOS')) {
            SEARCH_PATH = '.'
          }

          sh "npx wire-deploy-github-draft --github-token \"${GITHUB_ACCESS_TOKEN}\" --wrapper-build \"${WRAPPER_BUILD}\" --path \"${SEARCH_PATH}\""
        }
      } catch(e) {
        currentBuild.result = 'FAILED'
        wireSend secret: "$jenkinsbot_secret", message: "**Upload build as draft to Github failed for ${version}** see: ${JOB_URL}"
        throw e
      }
    }
  }
}
