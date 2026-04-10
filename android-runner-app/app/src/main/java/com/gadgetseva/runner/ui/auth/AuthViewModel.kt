package com.gadgetseva.runner.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gadgetseva.runner.data.repository.RunnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthUiState(
    val loading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false
)

class AuthViewModel(private val repository: RunnerRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState = _uiState.asStateFlow()

    fun login(username: String, password: String) {
        if (username.isBlank() || password.isBlank()) {
            _uiState.value = AuthUiState(error = "Username and password are required.")
            return
        }
        viewModelScope.launch {
            _uiState.value = AuthUiState(loading = true)
            repository.login(username.trim(), password).fold(
                onSuccess = {
                    // Pre-warm: fetch service requests in background so Dashboard loads instantly
                    launch { repository.getServiceRequests() }
                    _uiState.value = AuthUiState(success = true)
                },
                onFailure = { _uiState.value = AuthUiState(error = "Login failed. Check your credentials.") }
            )
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
