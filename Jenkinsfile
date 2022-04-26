pipeline {
    agent any
    
    options {
        parallelsAlwaysFailFast()  // https://stackoverflow.com/q/54698697/4480139
    }
    
    stages {
        stage('TEST') {
            steps {
                sh 'docker-compose up t_agent'       
            }
            post {
                failure {  
                    sh 'docker-compose down -v --remove-orphans; docker image rm wireapp_t_agent;'
                     mail bcc: '', body: "Project: ${env.JOB_NAME} <br>Build Number: ${env.BUILD_NUMBER} <br> URL de build: ${env.BUILD_URL}", cc: '', charset: 'UTF-8', from: '', mimeType: 'text/html', replyTo: '', subject: "ERROR CI: Project name -> ${env.JOB_NAME}", to: "bartosz.blyszcz@gmail.com";  
                 }  
             }
        }
        stage('END') {
            steps {
                sh 'docker-compose down -v --remove-orphans; docker image rm wireapp_t_agent;'
            }
        }
    }
   
}

