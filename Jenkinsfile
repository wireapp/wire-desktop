pipeline {
    agent any
    
    options {
        parallelsAlwaysFailFast()  // https://stackoverflow.com/q/54698697/4480139
    }
    
    stages {
        stage('BUILD') {
            steps {
                sh 'docker-compose up b_agent'
                sh 'git config http.version HTTP/1.1'
                sh 'git config http.postBuffer 157286400'
            }
            post {
                failure {  
                    mail bcc: '', body: "${env.BUILD_URL}", from: 'blyszcz@student.agh.edu.pl', subject: "ERROR ${env.BUILD_TAG}: BUILD", to: 'bartosz.blyszcz@gmail.com'  
                 }
                success {
                    archiveArtifacts artifacts: 'wrap/dist/*.deb', fingerprint: true
                    mail bcc: '', body: "${env.BUILD_URL}", from: 'blyszcz@student.agh.edu.pl', subject: "SUCCESS ${env.BUILD_TAG}: BUILD", to: 'bartosz.blyszcz@gmail.com'  
                 }
             }
        }
        stage('TEST') {
            steps {
                sh 'docker-compose up t_agent'       
            }
            post {
                failure {  
                    mail bcc: '', body: "${env.BUILD_URL}", from: 'blyszcz@student.agh.edu.pl', subject: "ERROR ${env.BUILD_TAG}: TEST", to: 'bartosz.blyszcz@gmail.com'  
                 }
                success {
                    mail bcc: '', body: "${env.BUILD_URL}", from: 'blyszcz@student.agh.edu.pl', subject: "SUCCESS ${env.BUILD_TAG}: TEST", to: 'bartosz.blyszcz@gmail.com'  
                 }
             }
        }
        stage('DEPLOY') {
            steps {
                sh 'mkdir -p latest'
                sh 'rm -rf latest; mkdir latest'
                copyArtifacts projectName: "${env.JOB_NAME}", selector: specific("${env.BUILD_NUMBER}"), filter: 'wrap/dist/*.deb', target: 'latest', fingerprintArtifacts: true
                sh 'tar cvf wireapp.tar latest/wrap/dist/*.deb; rm latest/wrap/dist/*.deb || true;'
                sh 'git stash push .'
                sh 'git checkout master'
                sh 'git pull'
                sh 'git stash pop'
                sh 'git add latest/*.deb'
                sh 'git commit -m "wire-app-deb-jenkins"'
                sh 'GIT_CURL_VERBOSE=1 git push'
            }
            post {
                    failure {  
                        mail bcc: '', body: "${env.BUILD_URL}", from: 'blyszcz@student.agh.edu.pl', subject: "ERROR ${env.BUILD_TAG}: DEPLOY", to: 'bartosz.blyszcz@gmail.com'  
                     }
                    success {
                        mail bcc: '', body: "${env.BUILD_URL}", from: 'blyszcz@student.agh.edu.pl', subject: "SUCCESS ${env.BUILD_TAG}: DEPLOY", to: 'bartosz.blyszcz@gmail.com'  
                     }
                 }
        }
    }
    post {
        always {  
            sh 'docker-compose down -v --remove-orphans || true; docker image rm wireapp_t_agent || true; docker image rm wireapp_b_agent || true'
         }
    }
   
}

