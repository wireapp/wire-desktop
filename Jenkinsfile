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
        }

        stage('END') {
            steps {
                sh 'docker-compose down -v --remove-orphans'
            }
        }
    }
   
}

