node('linux') {

    stage('Checkout & Clean') {
      git branch: "${GIT_BRANCH}", url: 'https://github.com/wireapp/wire-desktop.git'
    }

    stage('Create SHA256 checksums') {
      withCredentials([file(credentialsId: 'D599C1AA126762B1.asc', variable: 'PGP_PRIVATE_KEY_FILE'), string(credentialsId: 'PGP_PASSPHRASE', variable: 'PGP_PASSPHRASE')]) {
        sh "bin/linux-source-signing.sh ${version}"
      }
    }

    stage('Save signature') {
      archiveArtifacts '*.tar.gz.sig'
    }

}
