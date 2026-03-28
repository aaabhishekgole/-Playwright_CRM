package com.gadgetseva.dto;

import com.gadgetseva.entity.RequestPriority;
import com.gadgetseva.entity.RequestStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ServiceRequestResponse(
        Long id,
        String requestNumber,
        String tenantCode,
        String tenantName,
        String loanNumber,
        String certificateOfInsuranceNumber,
        String previousTicketNumber,
        String partnerReference,
        String projectName,
        String branchName,
        String employeeCode,
        String employeeName,
        String customerName,
        String contactPerson,
        String customerPhone,
        String alternatePhone,
        String whatsappNumber,
        String customerGstin,
        String customerEmail,
        String secondaryEmail,
        String customerAddress,
        String landmark,
        String googleMapLink,
        String customerCity,
        String customerState,
        String customerPostalCode,
        String deviceLabel,
        String deviceCategory,
        String serialNumber,
        String imeiNumber,
        String imeiValidationStatus,
        String qrCodePayload,
        String issueSummary,
        String issueDescription,
        RequestPriority priority,
        RequestStatus status,
        String sourceChannel,
        String pickupAgent,
        String technician,
        String deliveryAgent,
        PickupSummary pickup,
        Instant committedAt,
        Instant expectedCompletionAt,
        Instant slaDeadlineAt,
        Instant actualResolutionAt,
        Long tatMinutes,
        boolean slaBreached,
        String breachReason,
        InvoiceSummary invoice,
        List<PaymentItem> payments,
        List<NotificationItem> notifications,
        List<AuditItem> auditTrail,
        List<StatusHistoryItem> timeline,
        List<AttachmentItem> attachments,
        Instant createdAt,
        Instant updatedAt
) {

    public record StatusHistoryItem(
            String fromStatus,
            String toStatus,
            String remarks,
            String changedBy,
            String beforeValueJson,
            String afterValueJson,
            Instant changedAt
    ) {
    }

    public record AttachmentItem(
            Long id,
            String attachmentType,
            String fileName,
            String contentType,
            String objectKey,
            String checksum,
            String signedUrl,
            Instant signedUrlExpiresAt,
            Instant uploadedAt
    ) {
    }

    public record PickupSummary(
            String runnerName,
            String runnerPhone,
            Instant scheduledAt,
            String pickupOtp,
            String notes,
            Instant acceptedAt,
            Instant completedAt,
            Instant runnerLinkSentAt,
            String runnerPortalLink,
            Integer requiredPhotoCount,
            Integer uploadedRequiredPhotoCount,
            Integer uploadedOptionalPhotoCount
    ) {
    }

    public record InvoiceSummary(
            String invoiceNumber,
            String paymentStatus,
            String gstType,
            String customerGstin,
            String billingStateCode,
            String placeOfSupply,
            BigDecimal subtotal,
            BigDecimal taxAmount,
            BigDecimal totalAmount,
            BigDecimal cgstAmount,
            BigDecimal sgstAmount,
            BigDecimal igstAmount,
            BigDecimal amountPaid,
            BigDecimal amountDue,
            BigDecimal refundAmount,
            Instant issuedAt,
            List<InvoiceLineItem> items
    ) {
    }

    public record InvoiceLineItem(
            String description,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal taxableValue,
            BigDecimal gstRate,
            BigDecimal lineTotal
    ) {
    }

    public record PaymentItem(
            Long id,
            String paymentReference,
            String utrNumber,
            BigDecimal amount,
            String paymentMethod,
            String paymentStatus,
            String reconciliationStatus,
            String reconciliationRemarks,
            String refundStatus,
            BigDecimal refundAmount,
            String refundReason,
            Instant paidAt,
            Instant reconciledAt,
            Instant refundedAt
    ) {
    }

    public record NotificationItem(
            String channel,
            String recipient,
            String subject,
            String message,
            String deliveryStatus,
            Integer attemptCount,
            Integer maxAttempts,
            Instant nextRetryAt,
            String errorMessage,
            Instant createdAt
    ) {
    }

    public record AuditItem(
            String entityName,
            String action,
            String beforeJson,
            String afterJson,
            String changedBy,
            Instant changedAt
    ) {
    }
}
