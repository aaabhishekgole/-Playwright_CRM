package com.gadgetseva.runner.network

import com.gadgetseva.runner.session.SessionManager
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(private val sessionManager: SessionManager) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val token = sessionManager.getToken()
        val request = if (token != null) {
            chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        } else {
            chain.request()
        }
        val response = chain.proceed(request)
        // Only fire if there was a token — prevents loop after session already cleared
        if ((response.code == 401 || response.code == 403) && token != null) {
            sessionManager.clearSession()
            _sessionExpired.tryEmit(Unit)
        }
        return response
    }

    companion object {
        private val _sessionExpired = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
        val sessionExpired = _sessionExpired.asSharedFlow()
    }
}
