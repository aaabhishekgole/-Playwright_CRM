package com.gadgetseva.runner.ui.pickup

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gadgetseva.runner.data.model.ServiceRequestSummary
import com.gadgetseva.runner.ui.dashboard.StatusChip
import com.gadgetseva.runner.ui.requests.ServiceRequestCard

private val Blue = Color(0xFF1565C0)
private val Purple = Color(0xFF4A148C)
private val Orange = Color(0xFFE65100)
private val Red = Color(0xFFB71C1C)
private val Green = Color(0xFF1B5E20)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PickupManagementScreen(
    viewModel: PickupManagementViewModel,
    onRequestClick: (Long) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val items = state.tabItems

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Pickup Management", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { viewModel.load() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Blue,
                    titleContentColor = Color.White,
                    actionIconContentColor = Color.White
                )
            )
        }
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {

            // Tab row
            ScrollableTabRow(
                selectedTabIndex = PickupTab.entries.indexOf(state.activeTab),
                containerColor = MaterialTheme.colorScheme.surface,
                edgePadding = 0.dp
            ) {
                PickupTab.entries.forEach { tab ->
                    val count = when (tab) {
                        PickupTab.DASHBOARD -> state.all.size
                        PickupTab.PENDING -> state.all.count {
                            it.status in listOf("PICKUP_ASSIGNED", "PICKUP_IN_PROGRESS")
                        }
                        PickupTab.PICKED_UP -> state.all.count {
                            it.status in listOf("PICKED_UP", "RECEIVED_AT_HUB", "HUB_VERIFICATION_PENDING")
                        }
                        PickupTab.FAILED -> state.all.count {
                            it.status in listOf("CUSTOMER_NOT_AVAILABLE", "CUSTOMER_RESCHEDULED",
                                "CUSTOMER_NOT_CONTACTABLE", "PICKUP_FAILED")
                        }
                        PickupTab.HISTORY -> state.all.count {
                            it.status in listOf("PICKUP_COMPLETED", "RECEIVED_AT_HUB",
                                "HUB_VERIFICATION_PENDING", "UNDER_REPAIR", "REPAIR_IN_PROGRESS",
                                "REPAIR_COMPLETED", "QC_PASSED", "OUT_FOR_DELIVERY",
                                "INVOICED", "CLOSED")
                        }
                    }
                    val label = when (tab) {
                        PickupTab.DASHBOARD -> "Dashboard"
                        PickupTab.PENDING -> "Pending"
                        PickupTab.PICKED_UP -> "Picked Up"
                        PickupTab.FAILED -> "Failed"
                        PickupTab.HISTORY -> "History"
                    }
                    Tab(
                        selected = state.activeTab == tab,
                        onClick = { viewModel.setTab(tab) },
                        text = {
                            Text("$label ($count)", style = MaterialTheme.typography.labelSmall)
                        }
                    )
                }
            }

            when {
                state.loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
                state.error != null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(state.error ?: "Error", color = MaterialTheme.colorScheme.error)
                        Button(onClick = { viewModel.load() }) { Text("Retry") }
                    }
                }
                state.activeTab == PickupTab.DASHBOARD -> PickupDashboardTab(state.all)
                items.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No records found.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                else -> LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(items, key = { it.id }) { req ->
                        ServiceRequestCard(req, onClick = { onRequestClick(req.id) })
                    }
                }
            }
        }
    }
}

@Composable
private fun PickupDashboardTab(all: List<ServiceRequestSummary>) {
    val pending = all.count { it.status in listOf("PICKUP_ASSIGNED", "PICKUP_IN_PROGRESS") }
    val pickedUp = all.count { it.status in listOf("PICKED_UP", "RECEIVED_AT_HUB") }
    val failed = all.count {
        it.status in listOf("CUSTOMER_NOT_AVAILABLE", "CUSTOMER_RESCHEDULED",
            "CUSTOMER_NOT_CONTACTABLE", "PICKUP_FAILED")
    }
    val completed = all.count { it.status == "PICKUP_COMPLETED" }
    val inProgress = all.count { it.status == "PICKUP_IN_PROGRESS" }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Stage Overview", fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleSmall)
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StageCard(Modifier.weight(1f), pending.toString(), "Pending\nPickup", Purple)
                StageCard(Modifier.weight(1f), inProgress.toString(), "In\nProgress", Orange)
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StageCard(Modifier.weight(1f), pickedUp.toString(), "Picked\nUp", Blue)
                StageCard(Modifier.weight(1f), failed.toString(), "Failed\nCases", Red)
            }
        }
        item {
            StageCard(Modifier.fillMaxWidth(), completed.toString(), "Pickup Completed", Green)
        }

        // Recent pickups
        val recentPickups = all
            .filter { it.status?.contains("PICKUP") == true }
            .sortedByDescending { it.updatedAt }
            .take(5)

        if (recentPickups.isNotEmpty()) {
            item {
                Spacer(Modifier.height(4.dp))
                Text("Recent Pickup Activity", fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleSmall)
            }
            items(recentPickups) { req ->
                PickupActivityRow(req)
            }
        }
    }
}

@Composable
private fun StageCard(modifier: Modifier, count: String, label: String, color: Color) {
    Card(modifier = modifier, elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = color)) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(count, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Text(label, style = MaterialTheme.typography.bodySmall, color = Color.White.copy(alpha = 0.9f))
        }
    }
}

@Composable
private fun PickupActivityRow(req: ServiceRequestSummary) {
    Card(elevation = CardDefaults.cardElevation(1.dp)) {
        Row(Modifier.fillMaxWidth().padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(req.requestNumber ?: "—", fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.bodySmall, color = Blue)
                Text(req.customerName ?: "—", style = MaterialTheme.typography.bodySmall)
                if (req.pickupAgent != null) {
                    Text("Runner: ${req.pickupAgent}", style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                StatusChip(req.status ?: "—")
                Spacer(Modifier.height(4.dp))
                Text(req.updatedAt?.take(10) ?: "—", style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
