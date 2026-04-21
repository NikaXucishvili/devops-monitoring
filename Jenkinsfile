pipeline {
    agent any

    environment {
        FRONTEND_IMAGE = "devops-frontend"
        BACKEND_IMAGE  = "devops-backend"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose up -d'
            }
        }

    }

    post {
        success {
            echo "🚀 Pipeline SUCCESS - App deployed"
        }
        failure {
            echo "❌ Pipeline FAILED"
        }
    }
}
