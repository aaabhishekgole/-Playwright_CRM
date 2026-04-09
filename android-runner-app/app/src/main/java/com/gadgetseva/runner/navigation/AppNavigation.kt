package com.gadgetseva.runner.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.navArgument
import com.gadgetseva.runner.data.repository.RunnerRepository
import com.gadgetseva.runner.ui.auth.AuthViewModel
import com.gadgetseva.runner.ui.auth.LoginScreen
import com.gadgetseva.runner.ui.dashboard.DashboardScreen
import com.gadgetseva.runner.ui.dashboard.DashboardViewModel
import com.gadgetseva.runner.ui.inbox.InboxScreen
import com.gadgetseva.runner.ui.inbox.InboxViewModel
import com.gadgetseva.runner.ui.pickup.CameraScreen
import com.gadgetseva.runner.ui.pickup.PickupDetailScreen
import com.gadgetseva.runner.ui.pickup.PickupManagementScreen
import com.gadgetseva.runner.ui.pickup.PickupManagementViewModel
import com.gadgetseva.runner.ui.pickup.PickupViewModel
import com.gadgetseva.runner.ui.requests.ServiceRequestDetailScreen
import com.gadgetseva.runner.ui.requests.ServiceRequestDetailViewModel
import com.gadgetseva.runner.ui.requests.ServiceRequestsScreen
import com.gadgetseva.runner.ui.requests.ServiceRequestsViewModel

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Dashboard : Screen("dashboard")
    object ServiceRequests : Screen("service_requests")
    object PickupManagement : Screen("pickup_management")
    object RunnerInbox : Screen("runner_inbox")
    object ServiceRequestDetail : Screen("request/{id}") {
        fun createRoute(id: Long) = "request/$id"
    }
    object PickupDetail : Screen("pickup/{token}") {
        fun createRoute(token: String) = "pickup/$token"
    }
    object Camera : Screen("camera/{token}") {
        fun createRoute(token: String) = "camera/$token"
    }
}

private data class BottomNavItem(
    val screen: Screen,
    val label: String,
    val icon: ImageVector
)

private val bottomNavItems = listOf(
    BottomNavItem(Screen.Dashboard, "Dashboard", Icons.Default.Dashboard),
    BottomNavItem(Screen.ServiceRequests, "Requests", Icons.Default.List),
    BottomNavItem(Screen.PickupManagement, "Pickup", Icons.Default.LocalShipping),
    BottomNavItem(Screen.RunnerInbox, "My Pickups", Icons.Default.Notifications)
)

private val bottomNavRoutes = bottomNavItems.map { it.screen.route }.toSet()

@Composable
fun AppNavigation(
    navController: NavHostController,
    repository: RunnerRepository,
    startDestination: String
) {
    val authViewModel = AuthViewModel(repository)
    val dashboardViewModel = DashboardViewModel(repository)
    val serviceRequestsViewModel = ServiceRequestsViewModel(repository)
    val pickupManagementViewModel = PickupManagementViewModel(repository)
    val inboxViewModel = InboxViewModel(repository)
    val pickupViewModel = PickupViewModel(repository)
    val requestDetailViewModel = ServiceRequestDetailViewModel(repository)

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val showBottomBar = currentRoute in bottomNavRoutes

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomNavItems.forEach { item ->
                        NavigationBarItem(
                            selected = currentRoute == item.screen.route,
                            onClick = {
                                if (currentRoute != item.screen.route) {
                                    navController.navigate(item.screen.route) {
                                        popUpTo(Screen.Dashboard.route) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            icon = { Icon(item.icon, contentDescription = item.label) },
                            label = { Text(item.label) }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(innerPadding)
        ) {
            // ── Auth ──────────────────────────────────────────────────────
            composable(Screen.Login.route) {
                LoginScreen(
                    viewModel = authViewModel,
                    onLoginSuccess = {
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            // ── Dashboard ─────────────────────────────────────────────────
            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    viewModel = dashboardViewModel,
                    onRequestClick = { id ->
                        navController.navigate(Screen.ServiceRequestDetail.createRoute(id))
                    }
                )
            }

            // ── Service Requests ──────────────────────────────────────────
            composable(Screen.ServiceRequests.route) {
                ServiceRequestsScreen(
                    viewModel = serviceRequestsViewModel,
                    onRequestClick = { id ->
                        navController.navigate(Screen.ServiceRequestDetail.createRoute(id))
                    }
                )
            }

            composable(
                route = Screen.ServiceRequestDetail.route,
                arguments = listOf(navArgument("id") { type = NavType.LongType })
            ) { backStackEntry ->
                val id = backStackEntry.arguments?.getLong("id") ?: return@composable
                ServiceRequestDetailScreen(
                    requestId = id,
                    viewModel = requestDetailViewModel,
                    onBack = { navController.popBackStack() }
                )
            }

            // ── Pickup Management ─────────────────────────────────────────
            composable(Screen.PickupManagement.route) {
                PickupManagementScreen(
                    viewModel = pickupManagementViewModel,
                    onRequestClick = { id ->
                        navController.navigate(Screen.ServiceRequestDetail.createRoute(id))
                    }
                )
            }

            // ── Runner Inbox ──────────────────────────────────────────────
            composable(Screen.RunnerInbox.route) {
                InboxScreen(
                    viewModel = inboxViewModel,
                    onOpenPickup = { token ->
                        navController.navigate(Screen.PickupDetail.createRoute(token))
                    },
                    onLogout = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(Screen.RunnerInbox.route) { inclusive = true }
                            launchSingleTop = true
                        }
                    }
                )
            }

            // ── Pickup Detail (runner flow) ────────────────────────────────
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
}
