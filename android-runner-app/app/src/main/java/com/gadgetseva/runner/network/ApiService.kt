package com.gadgetseva.runner.network

import com.gadgetseva.runner.data.model.LoginRequest
import com.gadgetseva.runner.data.model.LoginResponse
import com.gadgetseva.runner.data.model.NotificationResponse
import com.gadgetseva.runner.data.model.PickupDetailResponse
import com.gadgetseva.runner.data.model.ServiceRequestSummary
import com.gadgetseva.runner.data.model.StatusTransitionRequest
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {

    // ── Auth ──────────────────────────────────────────────────────────────
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    // ── Runner inbox (JWT required via AuthInterceptor) ───────────────────
    @GET("api/mobile/runner/notifications")
    suspend fun getNotifications(): List<NotificationResponse>

    // ── Pickup portal (token-based, no JWT needed) ────────────────────────
    @GET("api/public/pickups/{token}")
    suspend fun getPickupDetail(@Path("token") token: String): PickupDetailResponse

    @POST("api/public/pickups/{token}/accept")
    suspend fun acceptPickup(@Path("token") token: String): PickupDetailResponse

    @POST("api/public/pickups/{token}/status")
    suspend fun updatePickupStatus(
        @Path("token") token: String,
        @Body request: StatusTransitionRequest
    ): PickupDetailResponse

    @Multipart
    @POST("api/public/pickups/{token}/attachments")
    suspend fun uploadAttachment(
        @Path("token") token: String,
        @Part("attachmentType") attachmentType: RequestBody,
        @Part file: MultipartBody.Part
    ): PickupDetailResponse

    @DELETE("api/public/pickups/{token}/attachments/{attachmentId}")
    suspend fun deleteAttachment(
        @Path("token") token: String,
        @Path("attachmentId") attachmentId: Long
    ): PickupDetailResponse

    @POST("api/public/pickups/{token}/complete")
    suspend fun completePickup(@Path("token") token: String): PickupDetailResponse

    // ── Service Requests (Ops view) ───────────────────────────────────────
    @GET("api/service-requests")
    suspend fun getServiceRequests(
        @Query("status") status: String? = null
    ): List<ServiceRequestSummary>

    @GET("api/service-requests/{id}")
    suspend fun getServiceRequestDetail(
        @Path("id") id: Long
    ): ServiceRequestSummary
}
