package com.gadgetseva.runner.data.model

// ── Auth ──────────────────────────────────────────────────────────────────
data class LoginRequest(
    val username: String,
    val password: String
)

data class LoginResponse(
    val accessToken: String,
    val tokenType: String?,
    val username: String,
    val role: String,
    val fullName: String?,
    val phone: String?
)

// ── Runner Inbox ──────────────────────────────────────────────────────────
data class NotificationResponse(
    val id: Long,
    val channel: String,
    val subject: String,
    val message: String,
    val deliveryStatus: String,
    val createdAt: String,
    val serviceRequestId: Long?,
    val requestNumber: String?,
    val customerName: String?,
    val deviceLabel: String?,
    val requestStatus: String?,
    val scheduledAt: String?,
    val runnerPortalToken: String?
)

// ── Pickup Detail ─────────────────────────────────────────────────────────
data class PickupDetailResponse(
    val id: Long,
    val requestNumber: String,
    val status: String,
    val issueSummary: String?,
    val customer: CustomerDto?,
    val device: DeviceDto?,
    val pickup: PickupDto?,
    val attachments: List<AttachmentDto>?
)

data class CustomerDto(
    val fullName: String?,
    val phone: String?,
    val email: String?,
    val address: String?
)

data class DeviceDto(
    val brand: String?,
    val model: String?,
    val serialNumber: String?,
    val imei: String?
)

data class PickupDto(
    val scheduledAt: String?,
    val runnerName: String?,
    val runnerPortalToken: String?
)

data class AttachmentDto(
    val id: Long,
    val attachmentType: String,
    val fileName: String,
    val signedUrl: String?,
    val fileSize: Long
)

// ── Status Update ─────────────────────────────────────────────────────────
data class StatusTransitionRequest(
    val status: String,
    val note: String? = null
)

// ── Service Request (Ops / Pickup Agent view) ─────────────────────────────
data class ServiceRequestSummary(
    val id: Long,
    val requestNumber: String?,
    val customerName: String?,
    val customerPhone: String?,
    val deviceLabel: String?,
    val deviceCategory: String?,
    val status: String?,
    val pickupAgent: String?,
    val issueSummary: String?,
    val slaBreached: Boolean = false,
    val createdAt: String?,
    val updatedAt: String?,
    val pickup: PickupSummaryDto?,
    val invoice: InvoiceSummaryDto?,
    val attachments: List<AttachmentItemDto>?
)

data class PickupSummaryDto(
    val runnerName: String?,
    val runnerPhone: String?,
    val scheduledAt: String?,
    val pickupOtp: String?,
    val acceptedAt: String?,
    val completedAt: String?,
    val requiredPhotoCount: Int?,
    val uploadedRequiredPhotoCount: Int?,
    val uploadedOptionalPhotoCount: Int?
)

data class InvoiceSummaryDto(
    val invoiceNumber: String?,
    val paymentStatus: String?,
    val totalAmount: Double?,
    val amountDue: Double?
)

data class AttachmentItemDto(
    val id: Long,
    val attachmentType: String?,
    val fileName: String?,
    val signedUrl: String?,
    val uploadedAt: String?
)
