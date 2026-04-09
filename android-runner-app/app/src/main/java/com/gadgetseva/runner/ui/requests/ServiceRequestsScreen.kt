package com.gadgetseva.runner.ui.requests

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.gadgetseva.runner.data.model.ServiceRequestSummary
import com.gadgetseva.runner.ui.dashboard.StatusChip

private val Blue = Color(0xFF1565C0)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceRequestsScreen(
    viewModel: ServiceRequestsViewModel,
    onRequestClick: (Long) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val items = state.displayed

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Service Requests", fontWeight = FontWeight.Bold) },
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
            // Search bar
            OutlinedTextField(
                value = state.searchQuery,
                onValueChange = { viewModel.setSearch(it) },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                placeholder = { Text("Search by request #, customer, phone...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true
            )

            // Filter tabs
            ScrollableTabRow(
                selectedTabIndex = RequestFilter.entries.indexOf(state.filter),
                containerColor = MaterialTheme.colorScheme.surface,
                edgePadding = 0.dp
            ) {
                RequestFilter.entries.forEachIndexed { i, f ->
                    val count = when (f) {
                        RequestFilter.ALL -> state.all.size
                        else -> state.displayed.let { _ ->
                            // recompute count for each filter
                            val closed = listOf("CLOSED", "CANCELLED")
                            val inProgress = listOf("PICKUP_ASSIGNED", "PICKUP_IN_PROGRESS", "PICKED_UP",
                                "RECEIVED_AT_HUB", "HUB_VERIFICATION_PENDING", "UNDER_REPAIR",
                                "REPAIR_IN_PROGRESS", "REPAIR_COMPLETED", "QC_IN_PROGRESS",
                                "QC_PASSED", "OUT_FOR_DELIVERY", "INVOICED")
                            when (f) {
                                RequestFilter.OPEN -> state.all.count { it.status == "REQUEST_CREATED" || it.status == "PICKUP_ASSIGNED" }
                                RequestFilter.IN_PROGRESS -> state.all.count { it.status in inProgress }
                                RequestFilter.CLOSED -> state.all.count { it.status in closed }
                                else -> 0
                            }
                        }
                    }
                    Tab(
                        selected = state.filter == f,
                        onClick = { viewModel.setFilter(f) },
                        text = {
                            Text("${f.name.replace("_", " ")} ($count)",
                                style = MaterialTheme.typography.labelSmall)
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
                items.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No requests found.", color = MaterialTheme.colorScheme.onSurfaceVariant)
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
fun ServiceRequestCard(req: ServiceRequestSummary, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically) {
                Text(req.requestNumber ?: "—", fontWeight = FontWeight.Bold,
                    color = Blue, style = MaterialTheme.typography.titleSmall)
                StatusChip(req.status ?: "—")
            }
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                LabelValue("Customer", req.customerName ?: "—")
                LabelValue("Phone", req.customerPhone ?: "—")
            }
            LabelValue("Device", req.deviceLabel ?: "—")
            if (req.pickupAgent != null) {
                LabelValue("Runner", req.pickupAgent)
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(req.updatedAt?.take(10) ?: "—", style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (req.slaBreached) {
                    Text("SLA BREACHED", style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFFB71C1C), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun LabelValue(label: String, value: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("$label:", style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium)
    }
}
