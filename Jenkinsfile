pipeline {
    agent any
    
    options {
        parallelsAlwaysFailFast()  // https://stackoverflow.com/q/54698697/4480139
    }
    
    stages {
        stage('TEST') {
            steps {
                sh 'exit 1'       
            }
            post {
                failure {  
                    sh 'docker-compose down -v --remove-orphans; docker image rm wireapp_t_agent;'
                     mail bcc: '', body: 'ERROR', from: 'blyszcz@student.agh.edu.pl', subject: 'ERROR TEST', to: 'bartosz.blyszcz@gmail.com';  
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

