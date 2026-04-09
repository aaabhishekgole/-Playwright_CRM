package com.gadgetseva.runner.ui.pickup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gadgetseva.runner.data.model.PickupDetailResponse
import com.gadgetseva.runner.data.repository.RunnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

data class PickupUiState(
    val loading: Boolean = false,
    val detail: PickupDetailResponse? = null,
    val error: String? = null,
    val actionSuccess: String? = null
)

class PickupViewModel(private val repository: RunnerRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(PickupUiState())
    val uiState = _uiState.asStateFlow()

    fun load(token: String) {
        viewModelScope.launch {
            _uiState.value = PickupUiState(loading = true)
            repository.getPickupDetail(token).fold(
                onSuccess = { _uiState.value = PickupUiState(detail = it) },
                onFailure = { _uiState.value = PickupUiState(error = it.message ?: "Failed to load pickup.") }
            )
        }
    }

    fun accept(token: String) = runAction(token, "Pickup accepted!") {
        repository.acceptPickup(token)
    }

    fun markPickedUp(token: String) = runAction(token, "Marked as picked up.") {
        repository.updateStatus(token, "PICKUP_COMPLETED")
    }

    fun markFailed(token: String, note: String) = runAction(token, "Marked as failed.") {
        repository.updateStatus(token, "CUSTOMER_NOT_AVAILABLE", note)
    }

    fun uploadPhoto(token: String, file: File) = runAction(token, "Photo uploaded.") {
        repository.uploadPhoto(token, file)
    }

    fun deletePhoto(token: String, attachmentId: Long) = runAction(token, "Photo deleted.") {
        repository.deletePhoto(token, attachmentId)
    }

    fun complete(token: String) = runAction(token, "Pickup completed successfully!") {
        repository.completePickup(token)
    }

    fun clearActionSuccess() {
        _uiState.value = _uiState.value.copy(actionSuccess = null)
    }

    private fun runAction(
        token: String,
        successMsg: String,
        block: suspend () -> Result<PickupDetailResponse>
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null, actionSuccess = null)
            block().fold(
                onSuccess = { _uiState.value = PickupUiState(detail = it, actionSuccess = successMsg) },
                onFailure = { _uiState.value = _uiState.value.copy(loading = false, error = it.message ?: "Action failed.") }
            )
        }
    }
}
