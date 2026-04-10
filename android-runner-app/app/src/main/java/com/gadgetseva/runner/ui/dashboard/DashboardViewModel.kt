package com.gadgetseva.runner.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gadgetseva.runner.data.model.ServiceRequestSummary
import com.gadgetseva.runner.data.repository.RunnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardStats(
    val openRequests: Int = 0,
    val pendingPickup: Int = 0,
    val repairQueue: Int = 0,
    val billingPending: Int = 0,
    val hubVerification: Int = 0,
    val estimateApprovals: Int = 0,
    val dispatchReady: Int = 0,
    val slaAlerts: Int = 0
)

data class DashboardUiState(
    val loading: Boolean = false,       // initial load — no data yet
    val isRefreshing: Boolean = false,  // refresh — data already visible
    val stats: DashboardStats = DashboardStats(),
    val recentActivity: List<ServiceRequestSummary> = emptyList(),
    val error: String? = null
)

class DashboardViewModel(private val repository: RunnerRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load(forceRefresh: Boolean = false) {
        val hasData = _uiState.value.recentActivity.isNotEmpty()
        viewModelScope.launch {
            // If we already have data, show refresh indicator instead of blanking the screen
            _uiState.value = if (hasData)
                _uiState.value.copy(isRefreshing = true, error = null)
            else
                _uiState.value.copy(loading = true, error = null)

            repository.getServiceRequests(forceRefresh).fold(
                onSuccess = { requests ->
                    val closed = listOf("CLOSED", "CANCELLED")
                    val pickupStatuses = listOf("PICKUP_ASSIGNED", "PICKUP_IN_PROGRESS")
                    val repairStatuses = listOf("REPAIR_IN_PROGRESS", "REPAIR_COMPLETED")
                    val hubStatuses = listOf("RECEIVED_AT_HUB", "HUB_VERIFICATION_PENDING", "PENDING_VERIFICATION")
                    val estimateStatuses = listOf("ESTIMATE_PENDING", "ESTIMATE_SUBMITTED", "CASHLESS_PENDING", "AWAITING_APPROVAL")
                    val dispatchStatuses = listOf("QC_PASSED", "REPAIR_COMPLETED")

                    val stats = DashboardStats(
                        openRequests = requests.count { it.status !in closed },
                        pendingPickup = requests.count { it.status in pickupStatuses },
                        repairQueue = requests.count { it.status in repairStatuses },
                        billingPending = requests.count { (it.invoice?.amountDue ?: 0.0) > 0 },
                        hubVerification = requests.count { it.status in hubStatuses },
                        estimateApprovals = requests.count { it.status in estimateStatuses },
                        dispatchReady = requests.count { it.status in dispatchStatuses },
                        slaAlerts = requests.count { it.slaBreached }
                    )
                    _uiState.value = DashboardUiState(
                        stats = stats,
                        recentActivity = requests.sortedByDescending { it.updatedAt }.take(10)
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        loading = false, isRefreshing = false,
                        error = it.message ?: "Failed to load dashboard."
                    )
                }
            )
        }
    }
}
