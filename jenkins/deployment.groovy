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
node('built-in') {
  def jenkinsbot_secret = ''
  withCredentials([string(credentialsId: 'JENKINSBOT_WRAPPER_CHAT', variable: 'JENKINSBOT_SECRET')]) {
    jenkinsbot_secret = env.JENKINSBOT_SECRET
  }

  stage('Checkout & Clean') {
    git branch: "${GIT_BRANCH}", url: 'https://github.com/wireapp/wire-desktop.git'
    sh returnStatus: true, script: 'rm -rf *.pkg *.zip ./wrap/dist/ ./wrap/build/ ./node_modules/'
  }

  def projectName = env.WRAPPER_BUILD.tokenize('#')[0]
  def version = env.WRAPPER_BUILD.tokenize('#')[1]
  echo("version: ${version}")
  def buildNumber = version.tokenize('.')[2]
  def NODE = tool name: 'node-v20.10.0', type: 'nodejs'
  env.DRY_RUN = params.DRY_RUN ? "--dry-run" : ""

  stage('Get build artifacts') {
    try {
      step([
        $class: 'CopyArtifact',
        filter: 'wrap/build/**,wrap/dist/**,**/*.pkg',
        projectName: "$projectName",
        selector: [
          $class: 'SpecificBuildSelector',
          buildNumber: "$version"
        ]
      ])
    } catch (e) {
      wireSend secret: "$jenkinsbot_secret",
               message: "**Could not get build artifacts from ${version} of ${projectName}** see: ${JOB_URL}"
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
        sh 'yarn'
      }
    } catch (e) {
      wireSend secret: "$jenkinsbot_secret",
               message: "**Could not get build artifacts of ${version} from ${projectName}** see: ${JOB_URL}"
      throw e
    }
  }

  stage('Upload to S3') {
    withEnv(["PATH+NODE=${NODE}/bin"]) {
      env.SEARCH_PATH = './wrap/dist/'

      if (projectName.contains('Windows')) {
        // -----------------------------
        // 1) Windows S3 Upload
        // -----------------------------
        env.S3_PATH = ''
        def AWS_ACCESS_KEY_CREDENTIALS_ID = ''
        def AWS_SECRET_CREDENTIALS_ID = ''

        if (params.Release == 'Production') {
          env.S3_PATH = 'win/prod'
          AWS_ACCESS_KEY_CREDENTIALS_ID = 'AWS_ACCESS_KEY_ID'
          AWS_SECRET_CREDENTIALS_ID = 'AWS_SECRET_ACCESS_KEY'
        } else if (params.Release == 'Internal') {
          env.S3_PATH = 'win/internal'
          AWS_ACCESS_KEY_CREDENTIALS_ID = 'AWS_ACCESS_KEY_ID'
          AWS_SECRET_CREDENTIALS_ID = 'AWS_SECRET_ACCESS_KEY'
        } else if (params.Release == 'Custom') {
          env.S3_BUCKET = params.WIN_S3_BUCKET
          env.S3_PATH = params.WIN_S3_PATH
          AWS_ACCESS_KEY_CREDENTIALS_ID = params.AWS_CUSTOM_ACCESS_KEY_ID
          AWS_SECRET_CREDENTIALS_ID = params.AWS_CUSTOM_SECRET_ACCESS_KEY
        }

        try {
          withCredentials([
            string(credentialsId: AWS_ACCESS_KEY_CREDENTIALS_ID, variable: 'AWS_ACCESS_KEY_ID'),
            string(credentialsId: AWS_SECRET_CREDENTIALS_ID, variable: 'AWS_SECRET_ACCESS_KEY')
          ]) {
            sh '''
              jenkins/ts-node.sh ./bin/deploy-tools/s3-cli.ts \
                --bucket "$S3_BUCKET" \
                --s3path "$S3_PATH" \
                --key-id "$AWS_ACCESS_KEY_ID" \
                --secret-key "$AWS_SECRET_ACCESS_KEY" \
                --wrapper-build "$WRAPPER_BUILD" \
                --path "$SEARCH_PATH" \
                $DRY_RUN
            '''
          }
        } catch(e) {
          currentBuild.result = 'FAILED'
          wireSend secret: "$jenkinsbot_secret",
                   message: "**Deploying to S3 failed for ${version}** see: ${JOB_URL}"
          throw e
        }

      } else if (projectName.contains('macOS')) {
        // -----------------------------
        // 2) macOS S3 Upload
        // -----------------------------
        def AWS_ACCESS_KEY_CREDENTIALS_ID = ''
        def AWS_SECRET_CREDENTIALS_ID = ''

        // Decide the s3path based on release
        if (params.Release == 'Production') {
          env.S3_PATH = 'mac/prod'
          env.S3_BUCKET = 'wire-taco'
          AWS_ACCESS_KEY_CREDENTIALS_ID = 'AWS_ACCESS_KEY_ID'
          AWS_SECRET_CREDENTIALS_ID = 'AWS_SECRET_ACCESS_KEY'
        } else if (params.Release == 'Internal') {
          env.S3_PATH = 'mac/internal'
          env.S3_BUCKET = 'wire-taco'
          AWS_ACCESS_KEY_CREDENTIALS_ID = 'AWS_ACCESS_KEY_ID'
          AWS_SECRET_CREDENTIALS_ID = 'AWS_SECRET_ACCESS_KEY'
        } else if (params.Release == 'Custom') {
          env.S3_BUCKET = params.MAC_S3_BUCKET
          env.S3_PATH = params.MAC_S3_PATH
          AWS_ACCESS_KEY_CREDENTIALS_ID = params.AWS_CUSTOM_ACCESS_KEY_ID
          AWS_SECRET_CREDENTIALS_ID = params.AWS_CUSTOM_SECRET_ACCESS_KEY
        }

        try {
          withCredentials([
            string(credentialsId: AWS_ACCESS_KEY_CREDENTIALS_ID, variable: 'AWS_ACCESS_KEY_ID'),
            string(credentialsId: AWS_SECRET_CREDENTIALS_ID, variable: 'AWS_SECRET_ACCESS_KEY')
          ]) {
            // Use Jenkins AWS plugin to authenticate
            withAWS(region: 'eu-west-1', credentials: 'wire-taco') {
              echo('Uploading macOS .pkg file manually to S3')

              def macosFiles = findFiles(glob: 'wrap/dist/*.pkg')
              if (macosFiles.length == 0) {
                error("No .pkg file found in wrap/dist")
              }

              // Always pick the first .pkg we found
              def pkgFilePath = macosFiles[0].path
              def pkgFileName = macosFiles[0].name
              def s3DestinationPath = "${env.S3_PATH}/${pkgFileName}"

              echo "Uploading ${pkgFilePath} to s3://${env.S3_BUCKET}/${s3DestinationPath}"

              if (params.DRY_RUN) {
                echo "DRY RUN enabled – skipping upload of macOS .pkg"
              } else {
                s3Upload(
                  acl: 'Private',
                  bucket: env.S3_BUCKET,
                  file: pkgFilePath,
                  path: s3DestinationPath
                )
              }

              // ------------------------------------------------------------------
              // Internal macOS auto-update artifacts for electron-updater
              // (latest-mac.yml + WireInternal-<version>.zip)
              // ------------------------------------------------------------------
              if (params.Release == 'Internal') {
                echo 'Uploading internal macOS auto-update artifacts (latest-mac.yml + zip)'

                def updatesPrefix = "${env.S3_PATH}/updates/"

                // latest-mac.yml
                def latestFiles = findFiles(glob: 'wrap/dist/latest-mac.yml')
                if (latestFiles && latestFiles.size() > 0) {
                  def latestPath = latestFiles[0].path
                  def latestDest = updatesPrefix + 'latest-mac.yml'
                  echo "Preparing latest-mac.yml upload to s3://${env.S3_BUCKET}/${latestDest}"

                  if (params.DRY_RUN) {
                    echo "DRY RUN enabled – would upload ${latestPath} to s3://${env.S3_BUCKET}/${latestDest}"
                  } else {
                    s3Upload(
                      acl: 'Private',
                      bucket: env.S3_BUCKET,
                      file: latestPath,
                      path: latestDest
                    )
                  }
                } else {
                  echo 'No latest-mac.yml found in wrap/dist – skipping upload'
                }

                // WireInternal-<version>.zip
                def zipFiles = findFiles(glob: 'wrap/dist/WireInternal-*.zip')
                if (!zipFiles || zipFiles.size() == 0) {
                  echo 'No WireInternal-*.zip found in wrap/dist – skipping zip upload'
                } else {
                  zipFiles.each { z ->
                    def zipDest = updatesPrefix + z.name
                    echo "Preparing ${z.path} upload to s3://${env.S3_BUCKET}/${zipDest}"

                    if (params.DRY_RUN) {
                      echo "DRY RUN enabled – would upload ${z.path} to s3://${env.S3_BUCKET}/${zipDest}"
                    } else {
                      s3Upload(
                        acl: 'Private',
                        bucket: env.S3_BUCKET,
                        file: z.path,
                        path: zipDest
                      )
                    }
                  }
                }
              }
            }
          }
        } catch(e) {
          currentBuild.result = 'FAILED'
          wireSend secret: "$jenkinsbot_secret",
                   message: "**Deploying macOS to S3 failed for ${version}** see: ${JOB_URL}"
          throw e
        }

      } else if (projectName.contains('Linux')) {
        // -----------------------------
        // 3) Linux S3 Upload
        // -----------------------------
        try {
          if (params.Release == 'Production') {
            S3_NAME = 'linux'

            withAWS(region:'eu-west-1', credentials: 'wire-taco') {
              echo('Upload repository files')
              s3Upload acl: 'PublicRead',
                       bucket: S3_BUCKET,
                       workingDir: 'wrap/dist/',
                       includePathPattern: 'debian/**',
                       path: S3_NAME + '/'

              echo('Upload files for download page')
              files = findFiles(glob: 'wrap/dist/*.deb,wrap/dist/*.AppImage')
              files.each {
                s3Upload acl: 'PublicRead',
                         bucket: S3_BUCKET,
                         file: it.path,
                         path: S3_NAME + '/' + it.name
              }
            }
          } else if (params.Release == 'Custom') {
            error('Please set S3_NAME for custom Linux')
          } else if (params.Release == 'Internal') {
            S3_NAME = 'linux-internal'

            withAWS(region:'eu-west-1', credentials: 'wire-taco') {
              echo('Upload repository files')
              s3Upload acl: 'PublicRead',
                       bucket: S3_BUCKET,
                       workingDir: 'wrap/dist/',
                       includePathPattern: 'debian/**',
                       path: S3_NAME + '/'

              echo('Upload files for download page')
              files = findFiles(glob: 'wrap/dist/*.deb,wrap/dist/*.AppImage')
              files.each {
                s3Upload acl: 'PublicRead',
                         bucket: S3_BUCKET,
                         file: it.path,
                         path: S3_NAME + '/' + it.name
              }
            }
          }
        } catch(e) {
          currentBuild.result = 'FAILED'
          wireSend secret: "$jenkinsbot_secret",
                   message: "**Deploying to S3 failed for ${version}** see: ${JOB_URL}"
          throw e
        }
      }
    }
  }

  // ------------------------------------------------------------------------
  // STAGE: Generate & Store Presigned URLs
  // (Separate handling for custom vs. internal/production)
  // ------------------------------------------------------------------------
  stage('Generate & Store Presigned URLs') {
    script {
      def artifacts = findFiles(glob: 'wrap/dist/*.*')
      if (!artifacts || artifacts.size() == 0) {
        error "No artifacts found in wrap/dist/*.*"
      }

      def presignedFile

      // Make sure we use Jenkins AWS plugin + local "aws" command
      withAWS(region: 'eu-west-1', credentials: 'wire-taco') {
        if (params.Release == 'Custom') {
          // Custom (on-prem)
          presignedFile = 'custom-presigned-urls.txt'
          sh "rm -f ${presignedFile}"

          artifacts.each { fileObj ->
            def presignedUrl = sh(
              script: """
                aws s3 presign s3://${env.S3_BUCKET}/${env.S3_PATH}/${fileObj.name} --expires-in 604800
              """,
              returnStdout: true
            ).trim()
            sh "echo '${fileObj.name}: ${presignedUrl}' >> ${presignedFile}"
          }

          // Upload to private on-prem or specialized bucket, no Jenkins archiving
          s3Upload(
            acl: 'Private',
            bucket: S3_BUCKET,
            file: presignedFile,
            path: "${env.S3_PATH}/${presignedFile}"
          )

          // We do NOT want this file in Jenkins artifacts -> removing local file
          sh "rm -f ${presignedFile}"

        } else {
          // Internal or Production
          def fileSuffix = params.Release == 'Production' ? 'prod' : 'internal'
          presignedFile = "${fileSuffix}-presigned-urls.txt"
          sh "rm -f ${presignedFile}"

          artifacts.each { fileObj ->
            def presignedUrl = sh(
              script: """
                aws s3 presign s3://${env.S3_BUCKET}/${env.S3_PATH}/${fileObj.name} --expires-in 604800
              """,
              returnStdout: true
            ).trim()
            sh "echo '${fileObj.name}: ${presignedUrl}' >> ${presignedFile}"
          }

          s3Upload(
            acl: 'Private',
            bucket: S3_BUCKET,
            file: presignedFile,
            path: "${env.S3_PATH}/${presignedFile}"
          )

          // Archive in Jenkins so teammates can see the URLs
          archiveArtifacts artifacts: presignedFile, fingerprint: true
        }
      }
    }
  }

  // ------------------------------------------------------------------------
  // Windows-specific stage: Update RELEASES file for Squirrel auto-updates
  // ------------------------------------------------------------------------
  if (projectName.contains('Windows')) {
    stage('Update RELEASES file') {
      try {
        withEnv(["PATH+NODE=${NODE}/bin"]) {
          def S3_PATH = ''
          def SEARCH_PATH = './wrap/dist/'
          def AWS_ACCESS_KEY_CREDENTIALS_ID = ''
          def AWS_SECRET_CREDENTIALS_ID = ''

          if (params.Release == 'Production') {
            S3_PATH = 'win/prod'
            S3_NAME = 'wire-' + version
            AWS_ACCESS_KEY_CREDENTIALS_ID = 'AWS_ACCESS_KEY_ID'
            AWS_SECRET_CREDENTIALS_ID = 'AWS_SECRET_ACCESS_KEY'
          } else if (params.Release == 'Internal') {
            S3_PATH = 'win/internal'
            S3_NAME = 'wireinternal-' + version
            AWS_ACCESS_KEY_CREDENTIALS_ID = 'AWS_ACCESS_KEY_ID'
            AWS_SECRET_CREDENTIALS_ID = 'AWS_SECRET_ACCESS_KEY'
          } else if (params.Release == 'Custom') {
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
              files = findFiles(glob: 'wrap/dist/*Setup.exe')

              // Remove old RELEASES
              s3Delete bucket: S3_BUCKET, path: S3_PATH + '/RELEASES'
              // Remove old Setup
              s3Delete bucket: S3_BUCKET, path: S3_PATH + '/' + files[0].name

              echo('Copy new RELEASE file and setup executable to default position')
              s3Copy acl: 'PublicRead',
                     fromBucket: S3_BUCKET,
                     fromPath: S3_PATH + '/' + S3_NAME + '-RELEASES',
                     toBucket: S3_BUCKET,
                     toPath: S3_PATH + '/RELEASES'

              s3Copy acl: 'PublicRead',
                     fromBucket: S3_BUCKET,
                     fromPath: S3_PATH + '/' + S3_NAME + '.exe',
                     toBucket: S3_BUCKET,
                     toPath: S3_PATH + '/' + files[0].name
            }
          }
        }
      } catch(e) {
        currentBuild.result = 'FAILED'
        wireSend secret: "$jenkinsbot_secret",
                 message: "**Changing RELEASES file failed for ${version}** see: ${JOB_URL}"
        throw e
      }
    }
  }

  // ------------------------------------------------------------------------
  // If this is macOS Production: upload .pkg to App Store Connect
  // ------------------------------------------------------------------------
  if (projectName.contains('macOS') && params.Release == 'Production') {
    stage('Upload macOS pkg to App Store Connect') {
      try {
        // Find the .pkg that was copied from the build job
        def pkgFiles = findFiles(glob: 'wrap/dist/*.pkg')
        if (pkgFiles.length == 0) {
          error("No .pkg file found in wrap/dist for App Store Connect upload")
        }

        def pkgPath = pkgFiles[0].path
        echo "Uploading ${pkgPath} to App Store Connect via altool"

        // Reuse the same credentials already used for notarization
        withCredentials([
          string(credentialsId: 'MACOS_NOTARIZATION_APPLE_ID',     variable: 'MACOS_NOTARIZATION_APPLE_ID'),
          string(credentialsId: 'MACOS_NOTARIZATION_PASSWORD',     variable: 'MACOS_NOTARIZATION_PASSWORD'),
          string(credentialsId: 'MACOS_NOTARIZATION_ASC_PROVIDER', variable: 'MACOS_NOTARIZATION_ASC_PROVIDER'),
        ]) {
          if (params.DRY_RUN) {
            // DRY RUN: log useful info
            def size = sh(script: "stat -f%z '${pkgPath}'", returnStdout: true).trim()
            def sha  = sh(script: "shasum -a 256 '${pkgPath}' | awk '{print \$1}'", returnStdout: true).trim()

            echo "DRY RUN enabled – skipping upload to App Store Connect"
            echo "Would have uploaded pkg: ${pkgPath}"
            echo "Package size: ${size} bytes"
            echo "Package SHA-256: ${sha}"

            echo """
            DRY RUN – would run:
            xcrun altool \\
              --upload-package "${pkgPath}" \\
              --type macos \\
              --username "\$MACOS_NOTARIZATION_APPLE_ID" \\
              --password ***hidden*** \\
              --asc-provider "\$MACOS_NOTARIZATION_ASC_PROVIDER"
            """

            echo "DRY RUN — simulated result: SUCCESS (upload skipped)"
          } else {
            // Run altool
            def status = sh(
              script: """
                set -euo pipefail

                xcrun altool \\
                  --upload-package "${pkgPath}" \\
                  --type macos \\
                  --username "\$MACOS_NOTARIZATION_APPLE_ID" \\
                  --password "\$MACOS_NOTARIZATION_PASSWORD" \\
                  --asc-provider "\$MACOS_NOTARIZATION_ASC_PROVIDER"
              """,
              returnStatus: true
            )

            if (status != 0) {
              echo "❌ App Store Connect upload failed with exit code ${status}. Check the altool output above for details."
              error "App Store Connect upload failed (exit code ${status})"
            } else {
              echo "✅ App Store Connect upload finished successfully."
            }
          }
        }

        echo "Upload to App Store Connect stage completed."
      } catch(e) {
        currentBuild.result = 'FAILED'
        wireSend secret: "$jenkinsbot_secret",
                 message: "**Upload macOS pkg to App Store Connect failed for ${version}** see: ${JOB_URL}"
        throw e
      }
    }
  }

  // ------------------------------------------------------------------------
  // If Release == Production, do a draft GitHub release
  // ------------------------------------------------------------------------
  if (params.Release == 'Production') {
    stage('Upload build as draft to GitHub') {
      try {
        withEnv(["PATH+NODE=${NODE}/bin"]) {
          env.SEARCH_PATH = './wrap/dist/'

          withCredentials([string(credentialsId: 'GITHUB_ACCESS_TOKEN', variable: 'GITHUB_ACCESS_TOKEN')]) {
            sh '''
              jenkins/ts-node.sh ./bin/deploy-tools/github-draft-cli.ts \
                --github-token "$GITHUB_ACCESS_TOKEN" \
                --wrapper-build "$WRAPPER_BUILD" \
                --path "$SEARCH_PATH" \
                $DRY_RUN
            '''
          }
        }
      } catch(e) {
        currentBuild.result = 'FAILED'
        wireSend secret: "$jenkinsbot_secret",
                 message: "**Upload build as draft to GitHub failed for ${version}** see: ${JOB_URL}"
        throw e
      }
    }
  }
}
