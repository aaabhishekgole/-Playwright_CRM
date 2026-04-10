package com.gadgetseva.runner.ui.requests

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gadgetseva.runner.data.model.ServiceRequestSummary
import com.gadgetseva.runner.data.repository.RunnerRepository
import com.gadgetseva.runner.ui.dashboard.StatusChip
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

// ── ViewModel ─────────────────────────────────────────────────────────────
data class RequestDetailUiState(
    val loading: Boolean = false,
    val request: ServiceRequestSummary? = null,
    val error: String? = null
)

class ServiceRequestDetailViewModel(private val repository: RunnerRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(RequestDetailUiState())
    val uiState = _uiState.asStateFlow()

    fun load(id: Long) {
        viewModelScope.launch {
            _uiState.value = RequestDetailUiState(loading = true)
            repository.getServiceRequestDetail(id).fold(
                onSuccess = { _uiState.value = RequestDetailUiState(request = it) },
                onFailure = { _uiState.value = RequestDetailUiState(error = it.message) }
            )
        }
    }
}

// ── Screen ────────────────────────────────────────────────────────────────
private val Blue = Color(0xFF1565C0)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceRequestDetailScreen(
    requestId: Long,
    viewModel: ServiceRequestDetailViewModel,
    onBack: () -> Unit
) {
    LaunchedEffect(requestId) { viewModel.load(requestId) }
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.request?.requestNumber ?: "Request Detail",
                    fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Blue,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White
                )
            )
        }
    ) { padding ->
        when {
            state.loading -> Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            state.error != null -> Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text(state.error ?: "Error", color = MaterialTheme.colorScheme.error)
            }
            state.request != null -> {
                val req = state.request!!
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Status banner
                    item {
                        Card(colors = CardDefaults.cardColors(containerColor = Blue)) {
                            Row(Modifier.fillMaxWidth().padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically) {
                                Column {
                                    Text(req.requestNumber ?: "—", color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        style = MaterialTheme.typography.titleMedium)
                                    Text("Updated: ${req.updatedAt?.take(10) ?: "—"}",
                                        color = Color.White.copy(alpha = 0.8f),
                                        style = MaterialTheme.typography.bodySmall)
                                }
                                StatusChip(req.status ?: "—")
                            }
                        }
                    }

                    // Customer info
                    item { SectionCard("Customer") {
                        DetailRow("Name", req.customerName)
                        DetailRow("Phone", req.customerPhone)
                        DetailRow("Device", req.deviceLabel)
                        DetailRow("Category", req.deviceCategory)
                        DetailRow("Issue", req.issueSummary)
                    }}

                    // Pickup info
                    if (req.pickup != null) {
                        item { SectionCard("Pickup Info") {
                            DetailRow("Runner", req.pickup.runnerName)
                            DetailRow("Runner Phone", req.pickup.runnerPhone)
                            DetailRow("Scheduled", req.pickup.scheduledAt?.take(16)?.replace("T", " "))
                            DetailRow("OTP", req.pickup.pickupOtp)
                            DetailRow("Accepted", req.pickup.acceptedAt?.take(16)?.replace("T", " "))
                            DetailRow("Completed", req.pickup.completedAt?.take(16)?.replace("T", " "))
                            if (req.pickup.requiredPhotoCount != null) {
                                DetailRow("Photos Required", req.pickup.requiredPhotoCount.toString())
                                DetailRow("Photos Uploaded", req.pickup.uploadedRequiredPhotoCount?.toString())
                            }
                        }}
                    }

                    // Invoice info
                    if (req.invoice != null) {
                        item { SectionCard("Invoice") {
                            DetailRow("Invoice #", req.invoice.invoiceNumber)
                            DetailRow("Payment Status", req.invoice.paymentStatus)
                            DetailRow("Total", req.invoice.totalAmount?.let { "₹%.2f".format(it) })
                            DetailRow("Amount Due", req.invoice.amountDue?.let { "₹%.2f".format(it) })
                        }}
                    }

                    // SLA
                    if (req.slaBreached) {
                        item {
                            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFFFEBEE))) {
                                Row(Modifier.padding(14.dp)) {
                                    Text("⚠️ SLA BREACHED", color = Color(0xFFB71C1C),
                                        fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionCard(title: String, content: @Composable ColumnScope.() -> Unit) {
    Card(elevation = CardDefaults.cardElevation(2.dp)) {
        Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall,
                color = Blue)
            HorizontalDivider()
            content()
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String?) {
    if (value.isNullOrBlank()) return
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("$label:", style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.widthIn(min = 100.dp))
        Text(value, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium)
    }
}
