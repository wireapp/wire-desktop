/*
Use the following Groovy script in the Extended Choice Parameter:

def list = []
jobs = jenkins.getAllItems()
jobs.each { job ->
  name = job.fullName
  if(name.contains('Windows Internal') || name.contains('Wrapper_Linux') || name.contains('Wrapper_macOS')) {
    builds = job.builds
    for (i = 0; i <5; i++) {
      lastbuild = job.builds[i]
      if(lastbuild) {
        list << name + '#' + lastbuild.displayName
      }
    }
  }
}
return list
*/
node('master') {

    def jenkinsbot_secret = ""
    withCredentials([string(credentialsId: 'JENKINSBOT_WRAPPER_CHAT', variable: 'JENKINSBOT_SECRET')]) {
        jenkinsbot_secret = env.JENKINSBOT_SECRET
    }

    stage('Checkout & Clean') {
        git branch: 'master', url: 'https://github.com/wireapp/wire-desktop.git'
        sh returnStatus: true, script: 'rm -rf wrap/'
        sh returnStatus: true, script: 'rm -rf info.json'
    }

    def projectName = env.WRAPPER_BUILD.tokenize('#')[0]
    def version = env.WRAPPER_BUILD.tokenize('#')[1]

    stage('Get build artifacts') {
        try {
            step ([$class: 'CopyArtifact',
            projectName: "$projectName",
            selector: [$class: 'SpecificBuildSelector', buildNumber: "$version"],
            filter: 'info.json,Wire.pkg,bin/WireInternal.zip,wrap/**']);
        } catch (e) {
            wireSend secret: "$jenkinsbot_secret", message: "**Could not get build artifacts from of ${version} from ${projectName}** see: ${JOB_URL}"
            throw e
        }
    }

    currentBuild.displayName = "Deploy $projectName " + version

    stage('Upload to S3 and/or Hockey') {
        if(projectName.contains('Windows')) {
            parallel hockey: {
                try {
                    if(params.Release.equals("Production")) {
                        withCredentials([string(credentialsId: 'WIN_PROD_HOCKEY_TOKEN', variable: 'WIN_PROD_HOCKEY_TOKEN'), string(credentialsId: 'WIN_PROD_HOCKEY_ID', variable: 'WIN_PROD_HOCKEY_ID')]) {
                            sh 'python bin/win-prod-hockey.py'
                        }
                    } else {
                        withCredentials([string(credentialsId: 'WIN_HOCKEY_TOKEN', variable: 'WIN_HOCKEY_TOKEN'), string(credentialsId: 'WIN_HOCKEY_ID', variable: 'WIN_HOCKEY_ID')]) {
                            sh 'python bin/win-hockey.py'
                        }
                    }
                } catch(e) {
                    currentBuild.result = "FAILED"
                    wireSend secret: "$jenkinsbot_secret", message: "**Deploying to Hockey failed for ${version}** see: ${JOB_URL}"
                    throw e
                }
            }, s3: {
                try {
                    withEnv(['BUCKET=wire-taco']) {
                        if(params.Release.equals("Production")) {
                            withCredentials([string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'), string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')]) {
                                sh 'python bin/win-prod-s3.py'
                            }
                        } else {
                            withCredentials([string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'), string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')]) {
                                sh 'python bin/win-s3.py'
                            }
                        }
                    }
                } catch(e) {
                    currentBuild.result = "FAILED"
                    wireSend secret: "$jenkinsbot_secret", message: "**Deploying to S3 failed for ${version}** see: ${JOB_URL}"
                    throw e
                }
            }, failFast: true
        } else if(projectName.contains('macOS')) {
            try {
                if(params.Release.equals('Production')) {
                    withCredentials([string(credentialsId: 'MACOS_MAS_HOCKEY_TOKEN', variable: 'MACOS_MAS_HOCKEY_TOKEN')]) {
                        sh './bin/macos-mas-hockey.sh'
                    }
                } else {
                    withCredentials([string(credentialsId: 'MACOS_HOCKEY_TOKEN', variable: 'MACOS_HOCKEY_TOKEN')]) {
                        sh 'python bin/macos-hockey.py'
                    }
                }
            } catch(e) {
                currentBuild.result = "FAILED"
                wireSend secret: "$jenkinsbot_secret", message: "**Deploying to Hockey failed for ${version}** see: ${JOB_URL}"
                throw e
            }
        } else if(projectName.contains('Linux')) {
            withEnv(['BUCKET=wire-taco']) {
                withCredentials([string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'), string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')]) {
                    sh "./bin/linux-prod-s3.py"
                }
            }
        }
    }

    if(projectName.contains('Windows')) {
        stage('Update RELEASES file') {
            try {
                withEnv(['BUCKET=wire-taco']) {
                    if(params.Release.equals("Production")) {
                        withCredentials([string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'), string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')]) {
                            sh 'python bin/win-prod-s3-deploy.py'
                        }
                    } else {
                        withCredentials([string(credentialsId: 'AWS_ACCESS_KEY_ID', variable: 'AWS_ACCESS_KEY_ID'), string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')]) {
                            sh 'python bin/win-s3-deploy.py'
                        }
                    }
                }
            } catch(e) {
                currentBuild.result = "FAILED"
                wireSend secret: "$jenkinsbot_secret", message: "**Changing RELEASES file failed for ${version}** see: ${JOB_URL}"
                throw e
            }
        }
    }

    if(params.Release.equals('Production')) {
      stage('Upload build as draft to GitHub') {
        withCredentials([string(credentialsId: 'GITHUB_ACCESS_TOKEN', variable: 'GITHUB_ACCESS_TOKEN')]) {
          if(projectName.contains('Windows')) {
            bat 'cd wrap\\prod\\Wire-win32-ia32\\ && python ..\\..\\..\\bin\\github_draft.py'
          } else if(projectName.contains('macOS')) {
            sh 'python bin/github_draft.py'
          } else if(projectName.contains('Linux')) {
            sh 'cd wrap/dist/ && python ../../bin/github_draft.py'
          }
        }
      }
    }
  }
}
