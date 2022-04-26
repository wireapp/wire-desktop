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
                    mail bcc: '', body: 'ERROR', from: 'blyszcz@student.agh.edu.pl', subject: '[TEST]ERROR', to: 'bartosz.blyszcz@gmail.com'  
                 }
                success {
                    mail bcc: '', body: 'SUCCESS', from: 'blyszcz@student.agh.edu.pl', subject: '[TEST]SUCCESS', to: 'bartosz.blyszcz@gmail.com'  
                 }
             }
        }
        post {
            always {  
                sh 'docker-compose down -v --remove-orphans || true; docker image rm wireapp_t_agent || true; docker image rm wireapp_b_agent || true'
             }
        }
    }
   
}

