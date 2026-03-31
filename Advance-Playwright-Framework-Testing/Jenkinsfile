pipeline {
  agent any

  stages {
    stage('Install') {
      steps {
        bat 'npm ci'
      }
    }

    stage('Typecheck') {
      steps {
        bat 'npm run typecheck'
      }
    }

    stage('Rule Engine') {
      steps {
        bat 'npm run rules:check'
      }
    }

    stage('Smoke') {
      steps {
        bat 'npx playwright test --grep @Smoke --project=chromium'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'Report/**', allowEmptyArchive: true
    }
  }
}
