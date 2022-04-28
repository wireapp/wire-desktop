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
                sh 'git checkout release '
                sh 'git pull origin master'
                sh 'var=$(git tag -l | grep "jenkins-release-" | awk \'{sub(/jenkins-release-/, "")}1\' | sort -rn | awk \'{ print $1+1}\' | head -n1); if [[ $var == "" ]]; then var=0; fi; git tag -a jenkins-release-$var;'     
                sh 'GIT_CURL_VERBOSE=1 git push --folow-tags'
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

