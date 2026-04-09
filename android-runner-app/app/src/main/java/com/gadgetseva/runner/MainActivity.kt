package com.gadgetseva.runner

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material3.MaterialTheme
import androidx.navigation.compose.rememberNavController
import com.gadgetseva.runner.data.repository.RunnerRepository
import com.gadgetseva.runner.navigation.AppNavigation
import com.gadgetseva.runner.navigation.Screen
import com.gadgetseva.runner.network.RetrofitClient
import com.gadgetseva.runner.session.SessionManager

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Bootstrap dependencies
        val sessionManager = SessionManager(applicationContext)
        RetrofitClient.init(sessionManager)
        val repository = RunnerRepository(sessionManager)

        // If already logged in, go straight to dashboard
        val startDestination = if (sessionManager.isLoggedIn())
            Screen.Dashboard.route
        else
            Screen.Login.route

        setContent {
            MaterialTheme {
                val navController = rememberNavController()
                AppNavigation(
                    navController = navController,
                    repository = repository,
                    startDestination = startDestination
                )
            }
        }
    }
}
