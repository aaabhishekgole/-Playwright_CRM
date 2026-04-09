package com.gadgetseva.runner.ui.pickup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gadgetseva.runner.data.model.ServiceRequestSummary
import com.gadgetseva.runner.data.repository.RunnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class PickupTab { DASHBOARD, PENDING, PICKED_UP, FAILED, HISTORY }

data class PickupManagementUiState(
    val loading: Boolean = false,
    val all: List<ServiceRequestSummary> = emptyList(),
    val error: String? = null,
    val activeTab: PickupTab = PickupTab.DASHBOARD
)

val PickupManagementUiState.tabItems: List<ServiceRequestSummary>
    get() = when (activeTab) {
        PickupTab.DASHBOARD -> all
        PickupTab.PENDING -> all.filter {
            it.status in listOf("PICKUP_ASSIGNED", "PICKUP_IN_PROGRESS")
        }
        PickupTab.PICKED_UP -> all.filter {
            it.status in listOf("PICKED_UP", "RECEIVED_AT_HUB", "HUB_VERIFICATION_PENDING")
        }
        PickupTab.FAILED -> all.filter {
            it.status in listOf(
                "CUSTOMER_NOT_AVAILABLE", "CUSTOMER_RESCHEDULED",
                "CUSTOMER_NOT_CONTACTABLE", "PICKUP_FAILED"
            )
        }
        PickupTab.HISTORY -> all.filter {
            it.status in listOf(
                "PICKUP_COMPLETED", "RECEIVED_AT_HUB", "HUB_VERIFICATION_PENDING",
                "UNDER_REPAIR", "REPAIR_IN_PROGRESS", "REPAIR_COMPLETED",
                "QC_PASSED", "QC_FAILED", "OUT_FOR_DELIVERY", "DELIVERED",
                "INVOICED", "CLOSED"
            )
        }
    }

class PickupManagementViewModel(private val repository: RunnerRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(PickupManagementUiState())
    val uiState = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            repository.getServiceRequests().fold(
                onSuccess = { _uiState.value = _uiState.value.copy(loading = false, all = it) },
                onFailure = { _uiState.value = _uiState.value.copy(loading = false, error = it.message) }
            )
        }
    }

    fun setTab(tab: PickupTab) { _uiState.value = _uiState.value.copy(activeTab = tab) }
}
