package com.gadgetseva.runner.ui.requests

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gadgetseva.runner.data.model.ServiceRequestSummary
import com.gadgetseva.runner.data.repository.RunnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class RequestFilter { ALL, OPEN, IN_PROGRESS, CLOSED }

data class ServiceRequestsUiState(
    val loading: Boolean = false,
    val all: List<ServiceRequestSummary> = emptyList(),
    val error: String? = null,
    val filter: RequestFilter = RequestFilter.ALL,
    val searchQuery: String = ""
)

val ServiceRequestsUiState.displayed: List<ServiceRequestSummary>
    get() {
        val closed = listOf("CLOSED", "CANCELLED")
        val inProgress = listOf(
            "PICKUP_ASSIGNED", "PICKUP_IN_PROGRESS", "PICKED_UP",
            "RECEIVED_AT_HUB", "HUB_VERIFICATION_PENDING", "UNDER_REPAIR",
            "REPAIR_IN_PROGRESS", "REPAIR_COMPLETED", "QC_IN_PROGRESS",
            "QC_PASSED", "QC_FAILED", "OUT_FOR_DELIVERY", "INVOICED"
        )
        val base = when (filter) {
            RequestFilter.ALL -> all
            RequestFilter.OPEN -> all.filter { it.status == "REQUEST_CREATED" || it.status == "PICKUP_ASSIGNED" }
            RequestFilter.IN_PROGRESS -> all.filter { it.status in inProgress }
            RequestFilter.CLOSED -> all.filter { it.status in closed }
        }
        return if (searchQuery.isBlank()) base
        else base.filter {
            it.requestNumber?.contains(searchQuery, ignoreCase = true) == true ||
            it.customerName?.contains(searchQuery, ignoreCase = true) == true ||
            it.customerPhone?.contains(searchQuery, ignoreCase = true) == true ||
            it.deviceLabel?.contains(searchQuery, ignoreCase = true) == true
        }
    }

class ServiceRequestsViewModel(private val repository: RunnerRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(ServiceRequestsUiState())
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

    fun setFilter(f: RequestFilter) { _uiState.value = _uiState.value.copy(filter = f) }
    fun setSearch(q: String) { _uiState.value = _uiState.value.copy(searchQuery = q) }
}
