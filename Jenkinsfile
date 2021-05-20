pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
              sh 'curl -sL https://deb.nodesource.com/setup_14.x | bash -'
                sh 'apt-get install nodejs -y'
                sh 'npm install --global --force yarn'
		echo 'Building....'
                              sh 'yarn build:linux'
		}
	}
	stage('Test') {
		steps {
			echo 'Testing....'
                sh 'yarn test'			
		}
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
            }
        }
    }
    
    post {
    	
    	success {
	 emailext attachLog: true, 
		 body: "${currentBuild.result}: ${BUILD_URL}", 
		 compressLog: true, 
		 subject: "Build Notification: ${JOB_NAME}-Build# ${BUILD_NUMBER} ${currentBuild.result}", 
		 to: 'kinga.laskawska@gmail.com'
		
    	}
    	
    	failure {
		emailext attachLog: true,
			body: "${currentBuild.currentResult}: Job ${env.JOB_NAME} build ${env.BUILD_NUMBER}", 
			subject: ' Jenkins notification', 
			to: 'kinga.laskawska@gmail.com'
    	}
    }
}
