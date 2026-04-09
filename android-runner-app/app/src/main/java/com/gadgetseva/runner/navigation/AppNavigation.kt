package com.gadgetseva.runner.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.gadgetseva.runner.data.repository.RunnerRepository
import com.gadgetseva.runner.ui.auth.AuthViewModel
import com.gadgetseva.runner.ui.auth.LoginScreen
import com.gadgetseva.runner.ui.inbox.InboxScreen
import com.gadgetseva.runner.ui.inbox.InboxViewModel
import com.gadgetseva.runner.ui.pickup.CameraScreen
import com.gadgetseva.runner.ui.pickup.PickupDetailScreen
import com.gadgetseva.runner.ui.pickup.PickupViewModel

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Inbox : Screen("inbox")
    object PickupDetail : Screen("pickup/{token}") {
        fun createRoute(token: String) = "pickup/${token}"
    }
    object Camera : Screen("camera/{token}") {
        fun createRoute(token: String) = "camera/${token}"
    }
}

@Composable
fun AppNavigation(
    navController: NavHostController,
    repository: RunnerRepository,
    startDestination: String
) {
    // ViewModels scoped to the nav graph lifetime
    val authViewModel = AuthViewModel(repository)
    val inboxViewModel = InboxViewModel(repository)
    val pickupViewModel = PickupViewModel(repository)

    NavHost(navController = navController, startDestination = startDestination) {

        composable(Screen.Login.route) {
            LoginScreen(
                viewModel = authViewModel,
                onLoginSuccess = {
                    navController.navigate(Screen.Inbox.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Inbox.route) {
            InboxScreen(
                viewModel = inboxViewModel,
                onOpenPickup = { token ->
                    navController.navigate(Screen.PickupDetail.createRoute(token))
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Screen.PickupDetail.route,
            arguments = listOf(navArgument("token") { type = NavType.StringType })
        ) { backStackEntry ->
            val token = backStackEntry.arguments?.getString("token") ?: return@composable
            PickupDetailScreen(
                token = token,
                viewModel = pickupViewModel,
                onBack = { navController.popBackStack() },
                onOpenCamera = { t ->
                    navController.navigate(Screen.Camera.createRoute(t))
                }
            )
        }

        composable(
            route = Screen.Camera.route,
            arguments = listOf(navArgument("token") { type = NavType.StringType })
        ) { backStackEntry ->
            val token = backStackEntry.arguments?.getString("token") ?: return@composable
            CameraScreen(
                token = token,
                viewModel = pickupViewModel,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
