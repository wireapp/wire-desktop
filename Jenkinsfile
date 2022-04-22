pipeline {
    agent any
    
    options {
        parallelsAlwaysFailFast()  // https://stackoverflow.com/q/54698697/4480139
    }
    
    stages {
        stage('TEST') {
            steps {
                
            }
        }
    }
   
    post { 
        always {
          sh 'docker-compose down --remove-orphans'
        }
    }
}

