package com.gadgetseva.runner.ui.dashboard

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gadgetseva.runner.data.model.ServiceRequestSummary

private val Blue = Color(0xFF1565C0)
private val LightBlue = Color(0xFFE3F2FD)
private val Orange = Color(0xFFE65100)
private val LightOrange = Color(0xFFFFF3E0)
private val Red = Color(0xFFB71C1C)
private val LightRed = Color(0xFFFFEBEE)
private val Green = Color(0xFF1B5E20)
private val LightGreen = Color(0xFFE8F5E9)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    onRequestClick: (Long) -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Dashboard", fontWeight = FontWeight.Bold)
                        Text(
                            "Operational overview",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.load(forceRefresh = true) }) {
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
        Box(Modifier.fillMaxSize().padding(padding)) {
            when {
                state.loading -> DashboardSkeleton()

                state.error != null && state.recentActivity.isEmpty() -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(state.error ?: "Error", color = MaterialTheme.colorScheme.error)
                            Button(onClick = { viewModel.load(forceRefresh = true) }) {
                                Text("Retry")
                            }
                        }
                    }
                }

                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // KPI row 1
                        item {
                            Row(
                                Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                KpiCard(Modifier.weight(1f), state.stats.openRequests.toString(),
                                    "Open Requests", Blue, LightBlue)
                                KpiCard(Modifier.weight(1f), state.stats.pendingPickup.toString(),
                                    "Pending Pickup", Orange, LightOrange)
                            }
                        }
                        // KPI row 2
                        item {
                            Row(
                                Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                KpiCard(Modifier.weight(1f), state.stats.repairQueue.toString(),
                                    "Repair Queue", Green, LightGreen)
                                KpiCard(Modifier.weight(1f), state.stats.billingPending.toString(),
                                    "Billing Pending", Red, LightRed)
                            }
                        }

                        // Attention queues
                        item {
                            Text(
                                "Immediate Action Queues",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleSmall
                            )
                        }
                        item {
                            Card(elevation = CardDefaults.cardElevation(2.dp)) {
                                Column(Modifier.fillMaxWidth()) {
                                    AttentionRow("Hub Verification",
                                        "Devices waiting for inward & IMEI validation",
                                        state.stats.hubVerification)
                                    HorizontalDivider()
                                    AttentionRow("Estimate Approvals",
                                        "Estimate or cashless review cases awaiting action",
                                        state.stats.estimateApprovals)
                                    HorizontalDivider()
                                    AttentionRow("Dispatch Readiness",
                                        "Cases approaching delivery handoff",
                                        state.stats.dispatchReady)
                                    HorizontalDivider()
                                    AttentionRow("SLA Risk",
                                        "Breached or aging claims that need escalation",
                                        state.stats.slaAlerts, isAlert = true)
                                }
                            }
                        }

                        // Recent activity
                        item {
                            Text(
                                "Recent Activity",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleSmall
                            )
                        }
                        if (state.recentActivity.isEmpty()) {
                            item {
                                Text(
                                    "No recent activity.",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        } else {
                            items(state.recentActivity) { req ->
                                RecentActivityRow(req, onClick = { onRequestClick(req.id) })
                            }
                        }
                    }
                }
            }

            // Refresh progress bar — overlays content during background refresh
            if (state.isRefreshing) {
                LinearProgressIndicator(Modifier.fillMaxWidth().align(Alignment.TopCenter))
            }
        }
    }
}

@Composable
private fun DashboardSkeleton() {
    val shimmerColors = listOf(Color(0xFFE0E0E0), Color(0xFFF5F5F5), Color(0xFFE0E0E0))
    val transition = rememberInfiniteTransition(label = "shimmer")
    val offset by transition.animateFloat(
        initialValue = 0f, targetValue = 1000f,
        animationSpec = infiniteRepeatable(tween(1000, easing = LinearEasing)),
        label = "shimmer_offset"
    )
    val brush = Brush.linearGradient(
        shimmerColors,
        start = Offset(offset, offset),
        end = Offset(offset + 300f, offset + 300f)
    )

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                repeat(2) {
                    Box(Modifier.weight(1f).height(88.dp).background(brush, RoundedCornerShape(12.dp)))
                }
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                repeat(2) {
                    Box(Modifier.weight(1f).height(88.dp).background(brush, RoundedCornerShape(12.dp)))
                }
            }
        }
        item { Box(Modifier.fillMaxWidth().height(160.dp).background(brush, RoundedCornerShape(12.dp))) }
        items(4) { Box(Modifier.fillMaxWidth().height(72.dp).background(brush, RoundedCornerShape(8.dp))) }
    }
}

@Composable
private fun KpiCard(modifier: Modifier, value: String, label: String, textColor: Color, bgColor: Color) {
    Card(
        modifier = modifier,
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor)
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(value, fontSize = 28.sp, fontWeight = FontWeight.Bold, color = textColor)
            Text(label, style = MaterialTheme.typography.bodySmall, color = textColor)
        }
    }
}

@Composable
private fun AttentionRow(title: String, subtitle: String, count: Int, isAlert: Boolean = false) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
            Text(subtitle, style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = if (isAlert && count > 0) Red else Blue
        ) {
            Text(
                count.toString(),
                Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                color = Color.White,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.labelMedium
            )
        }
    }
}

@Composable
private fun RecentActivityRow(req: ServiceRequestSummary, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(1.dp)
    ) {
        Row(
            Modifier.fillMaxWidth().padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f)) {
                Text(req.requestNumber ?: "—", fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.bodyMedium, color = Blue)
                Text(req.customerName ?: "—", style = MaterialTheme.typography.bodySmall)
                Text(req.deviceLabel ?: "—", style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Column(horizontalAlignment = Alignment.End) {
                StatusChip(req.status ?: "—")
                Spacer(Modifier.height(4.dp))
                Text(req.updatedAt?.take(10) ?: "—",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
fun StatusChip(status: String) {
    val (bg, fg) = statusColors(status)
    Surface(shape = RoundedCornerShape(4.dp), color = bg) {
        Text(
            text = status.replace("_", " "),
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
            style = MaterialTheme.typography.labelSmall,
            color = fg,
            fontWeight = FontWeight.Bold
        )
    }
}

fun statusColors(status: String): Pair<Color, Color> = when {
    status.contains("CLOSED") || status.contains("COMPLETE") || status.contains("DELIVERED") ->
        Color(0xFF1B5E20) to Color(0xFFE8F5E9)
    status.contains("CANCEL") || status.contains("FAIL") || status.contains("LOSS") ->
        Color(0xFFB71C1C) to Color(0xFFFFEBEE)
    status.contains("PICKUP") ->
        Color(0xFF4A148C) to Color(0xFFF3E5F5)
    status.contains("REPAIR") ->
        Color(0xFFE65100) to Color(0xFFFFF3E0)
    status.contains("ESTIMATE") || status.contains("APPROVAL") ->
        Color(0xFF0D47A1) to Color(0xFFE3F2FD)
    status.contains("INVOICE") || status.contains("BILLING") ->
        Color(0xFF1A237E) to Color(0xFFE8EAF6)
    else -> Color(0xFF37474F) to Color(0xFFECEFF1)
}
