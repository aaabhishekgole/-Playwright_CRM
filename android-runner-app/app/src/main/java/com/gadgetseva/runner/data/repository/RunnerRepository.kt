package com.gadgetseva.runner.data.repository

import com.gadgetseva.runner.data.model.LoginRequest
import com.gadgetseva.runner.data.model.NotificationResponse
import com.gadgetseva.runner.data.model.PickupDetailResponse
import com.gadgetseva.runner.data.model.StatusTransitionRequest
import com.gadgetseva.runner.network.RetrofitClient
import com.gadgetseva.runner.session.SessionManager
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class RunnerRepository(private val sessionManager: SessionManager) {

    private val api get() = RetrofitClient.apiService

    // ── Auth ──────────────────────────────────────────────────────────────
    suspend fun login(username: String, password: String): Result<Unit> {
        return try {
            val response = api.login(LoginRequest(username, password))
            sessionManager.saveSession(response.accessToken, response.username, response.role)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun logout() = sessionManager.clearSession()

    // ── Inbox ─────────────────────────────────────────────────────────────
    suspend fun getNotifications(): Result<List<NotificationResponse>> {
        return try {
            Result.success(api.getNotifications())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ── Pickup ────────────────────────────────────────────────────────────
    suspend fun getPickupDetail(token: String): Result<PickupDetailResponse> {
        return try {
            Result.success(api.getPickupDetail(token))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun acceptPickup(token: String): Result<PickupDetailResponse> {
        return try {
            Result.success(api.acceptPickup(token))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateStatus(
        token: String,
        status: String,
        note: String? = null
    ): Result<PickupDetailResponse> {
        return try {
            Result.success(api.updatePickupStatus(token, StatusTransitionRequest(status, note)))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadPhoto(
        token: String,
        photoFile: File,
        attachmentType: String = "DEVICE_PHOTO"
    ): Result<PickupDetailResponse> {
        return try {
            val requestFile = photoFile.asRequestBody("image/jpeg".toMediaType())
            val body = MultipartBody.Part.createFormData("file", photoFile.name, requestFile)
            val typeBody = attachmentType.toRequestBody("text/plain".toMediaType())
            Result.success(api.uploadAttachment(token, typeBody, body))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deletePhoto(token: String, attachmentId: Long): Result<PickupDetailResponse> {
        return try {
            Result.success(api.deleteAttachment(token, attachmentId))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun completePickup(token: String): Result<PickupDetailResponse> {
        return try {
            Result.success(api.completePickup(token))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
