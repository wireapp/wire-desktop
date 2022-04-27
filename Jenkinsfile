pipeline {
    agent any
    
    options {
        parallelsAlwaysFailFast()  // https://stackoverflow.com/q/54698697/4480139
    }
    
    stages {
        stage('BUILD') {
            steps {
                sh 'docker-compose up b_agent'   
                sh 'git config user.email "jenkins@wireapp.com"; git config user.name "jenkins_wireapp"'    
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
                sh 'rm -rf latest/*'
                copyArtifacts projectName: "${env.JOB_NAME}", selector: specific("${env.BUILD_NUMBER}"), filter: 'wrap/dist/*.deb', target: 'latest', fingerprintArtifacts: true
                sh 'git checkout master'
                sh 'git add latest/*.deb'
                sh 'git commit -m "wire-app-deb-jenkins"'
                sh 'git push'
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

