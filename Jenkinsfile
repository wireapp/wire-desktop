pipeline {
    agent any
    
    options {
        parallelsAlwaysFailFast()  // https://stackoverflow.com/q/54698697/4480139
    }
    
    stages {
        stage('BUILD') {
            steps {
                sh 'docker-compose up b_agent'       
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
    }
    post {
        always {  
            sh 'docker-compose down -v --remove-orphans || true; docker image rm wireapp_t_agent || true; docker image rm wireapp_b_agent || true'
         }
    }
   
}

