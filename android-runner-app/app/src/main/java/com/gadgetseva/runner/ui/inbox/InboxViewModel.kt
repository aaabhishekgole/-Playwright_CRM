package com.gadgetseva.runner.ui.inbox

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gadgetseva.runner.data.model.NotificationResponse
import com.gadgetseva.runner.data.repository.RunnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class InboxUiState(
    val loading: Boolean = false,
    val notifications: List<NotificationResponse> = emptyList(),
    val error: String? = null
)

class InboxViewModel(private val repository: RunnerRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(InboxUiState())
    val uiState = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.value = InboxUiState(loading = true)
            repository.getNotifications().fold(
                onSuccess = { _uiState.value = InboxUiState(notifications = it) },
                onFailure = { _uiState.value = InboxUiState(error = it.message ?: "Failed to load pickups.") }
            )
        }
    }

    fun logout(onDone: () -> Unit) {
        repository.logout()
        onDone()
    }
}
