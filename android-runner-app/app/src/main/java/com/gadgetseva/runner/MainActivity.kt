package com.gadgetseva.runner

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.LaunchedEffect
import androidx.navigation.compose.rememberNavController
import com.gadgetseva.runner.data.repository.RunnerRepository
import com.gadgetseva.runner.navigation.AppNavigation
import com.gadgetseva.runner.navigation.Screen
import com.gadgetseva.runner.network.AuthInterceptor
import com.gadgetseva.runner.network.RetrofitClient
import com.gadgetseva.runner.session.SessionManager

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val sessionManager = try {
            SessionManager(applicationContext)
        } catch (e: Exception) {
            Log.e("MainActivity", "SessionManager init failed", e)
            SessionManager(applicationContext)
        }
        RetrofitClient.init(sessionManager)
        val repository = RunnerRepository(sessionManager)

        val startDestination = try {
            if (sessionManager.isLoggedIn()) Screen.Dashboard.route else Screen.Login.route
        } catch (e: Exception) {
            Log.e("MainActivity", "isLoggedIn check failed", e)
            Screen.Login.route
        }

        setContent {
            MaterialTheme {
                val navController = rememberNavController()

                // Auto-logout when token expires (401/403 from any API call)
                LaunchedEffect(Unit) {
                    AuthInterceptor.sessionExpired.collect {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                }

                AppNavigation(
                    navController = navController,
                    repository = repository,
                    startDestination = startDestination
                )
            }
        }
    }
}
