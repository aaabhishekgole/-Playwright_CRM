package com.gadgetseva.mapper;

import com.gadgetseva.dto.ServiceRequestResponse;
import com.gadgetseva.entity.Attachment;
import com.gadgetseva.entity.AuditLog;
import com.gadgetseva.entity.DeviceCategory;
import com.gadgetseva.entity.Invoice;
import com.gadgetseva.entity.InvoiceLineItem;
import com.gadgetseva.entity.NotificationLog;
import com.gadgetseva.entity.PaymentTransaction;
import com.gadgetseva.entity.Pickup;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.entity.StatusHistory;
import com.gadgetseva.service.FileStorageService;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ServiceRequestMapper {

    private final FileStorageService fileStorageService;

    public ServiceRequestMapper(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    public ServiceRequestResponse toResponse(ServiceRequest request,
                                             Pickup pickup,
                                             String runnerPortalBaseUrl,
                                             List<StatusHistory> history,
                                             List<Attachment> attachments,
                                             Invoice invoice,
                                             List<InvoiceLineItem> invoiceItems,
                                             List<PaymentTransaction> payments,
                                             List<NotificationLog> notifications,
                                             List<AuditLog> auditLogs) {
        return new ServiceRequestResponse(
                request.getId(),
                request.getRequestNumber(),
                request.getTenant() != null ? request.getTenant().getCode() : null,
                request.getTenant() != null ? request.getTenant().getName() : null,
                request.getLoanNumber(),
                request.getCertificateOfInsuranceNumber(),
                request.getPreviousTicketNumber(),
                request.getPartnerReference(),
                request.getProjectName(),
                request.getBranchName(),
                request.getEmployeeCode(),
                request.getEmployeeName(),
                request.getCustomer().getFullName(),
                request.getCustomer().getContactPerson(),
                request.getCustomer().getPhone(),
                request.getCustomer().getAlternatePhone(),
                request.getCustomer().getWhatsappNumber(),
                request.getCustomer().getGstin(),
                request.getCustomer().getEmail(),
                request.getCustomer().getSecondaryEmail(),
                request.getCustomer().getAddressLine1(),
                request.getCustomer().getLandmark(),
                request.getCustomer().getGoogleMapLink(),
                request.getCustomer().getCity(),
                request.getCustomer().getState(),
                request.getCustomer().getPostalCode(),
                request.getDevice().getBrand() + " " + request.getDevice().getModel(),
                (request.getDevice().getDeviceCategory() != null ? request.getDevice().getDeviceCategory() : DeviceCategory.MOBILE).name(),
                request.getDevice().getSerialNumber(),
                request.getDevice().getImeiNumber(),
                request.getDevice().getImeiValidationStatus().name(),
                request.getDevice().getQrCodePayload(),
                request.getIssueSummary(),
                request.getIssueDescription(),
                request.getPriority(),
                request.getStatus(),
                request.getSourceChannel(),
                request.getAssignedPickupAgent() != null ? request.getAssignedPickupAgent().getFullName() : null,
                request.getAssignedTechnician() != null ? request.getAssignedTechnician().getFullName() : null,
                request.getAssignedDeliveryAgent() != null ? request.getAssignedDeliveryAgent().getFullName() : null,
                mapPickup(pickup, attachments, runnerPortalBaseUrl),
                request.getCommittedAt(),
                request.getExpectedCompletionAt(),
                request.getSlaDeadlineAt(),
                request.getActualResolutionAt(),
                request.getTatMinutes(),
                request.isSlaBreached(),
                request.getBreachReason(),
                mapInvoice(invoice, invoiceItems),
                payments.stream().map(this::mapPayment).toList(),
                notifications.stream().map(this::mapNotification).toList(),
                auditLogs.stream().map(this::mapAudit).toList(),
                history.stream().map(this::mapHistory).toList(),
                attachments.stream().map(this::mapAttachment).toList(),
                request.getCreatedAt(),
                request.getUpdatedAt()
        );
    }

    private ServiceRequestResponse.StatusHistoryItem mapHistory(StatusHistory history) {
        return new ServiceRequestResponse.StatusHistoryItem(
                history.getFromStatus(),
                history.getToStatus(),
                history.getRemarks(),
                history.getChangedBy() != null ? history.getChangedBy().getFullName() : "SYSTEM",
                history.getBeforeValueJson(),
                history.getAfterValueJson(),
                history.getChangedAt()
        );
    }

    private ServiceRequestResponse.AttachmentItem mapAttachment(Attachment attachment) {
        Instant expiresAt = Instant.now().plusSeconds(900);
        return new ServiceRequestResponse.AttachmentItem(
                attachment.getId(),
                attachment.getAttachmentType(),
                attachment.getFileName(),
                attachment.getContentType(),
                attachment.getObjectKey(),
                attachment.getChecksum(),
                fileStorageService.generateSignedUrl(attachment.getObjectKey(), expiresAt),
                expiresAt,
                attachment.getUploadedAt()
        );
    }

    private ServiceRequestResponse.InvoiceSummary mapInvoice(Invoice invoice, List<InvoiceLineItem> invoiceItems) {
        if (invoice == null) {
            return null;
        }
        return new ServiceRequestResponse.InvoiceSummary(
                invoice.getInvoiceNumber(),
                invoice.getPaymentStatus(),
                invoice.getGstType().name(),
                invoice.getCustomerGstin(),
                invoice.getBillingStateCode(),
                invoice.getPlaceOfSupply(),
                invoice.getSubtotal(),
                invoice.getTaxAmount(),
                invoice.getTotalAmount(),
                invoice.getCgstAmount(),
                invoice.getSgstAmount(),
                invoice.getIgstAmount(),
                invoice.getAmountPaid(),
                invoice.getAmountDue(),
                invoice.getRefundAmount(),
                invoice.getIssuedAt(),
                invoiceItems.stream().map(item -> new ServiceRequestResponse.InvoiceLineItem(
                        item.getDescription(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getTaxableValue(),
                        item.getGstRate(),
                        item.getLineTotal()
                )).toList()
        );
    }

    private ServiceRequestResponse.PaymentItem mapPayment(PaymentTransaction payment) {
        return new ServiceRequestResponse.PaymentItem(
                payment.getId(),
                payment.getPaymentReference(),
                payment.getUtrNumber(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getPaymentStatus().name(),
                payment.getReconciliationStatus().name(),
                payment.getReconciliationRemarks(),
                payment.getRefundStatus().name(),
                payment.getRefundAmount(),
                payment.getRefundReason(),
                payment.getPaidAt(),
                payment.getReconciledAt(),
                payment.getRefundedAt()
        );
    }

    private ServiceRequestResponse.NotificationItem mapNotification(NotificationLog notification) {
        return new ServiceRequestResponse.NotificationItem(
                notification.getChannel(),
                notification.getRecipient(),
                notification.getSubject(),
                notification.getMessage(),
                notification.getDeliveryStatus().name(),
                notification.getAttemptCount(),
                notification.getMaxAttempts(),
                notification.getNextRetryAt(),
                notification.getErrorMessage(),
                notification.getCreatedAt()
        );
    }

    private ServiceRequestResponse.AuditItem mapAudit(AuditLog auditLog) {
        return new ServiceRequestResponse.AuditItem(
                auditLog.getEntityName(),
                auditLog.getAction(),
                auditLog.getBeforeJson(),
                auditLog.getAfterJson(),
                auditLog.getChangedBy() != null ? auditLog.getChangedBy().getFullName() : "SYSTEM",
                auditLog.getChangedAt()
        );
    }

    private ServiceRequestResponse.PickupSummary mapPickup(Pickup pickup, List<Attachment> attachments, String runnerPortalBaseUrl) {
        if (pickup == null) {
            return null;
        }

        int requiredPickupPhotos = (int) attachments.stream()
                .filter(attachment -> attachment.getAttachmentType().startsWith("PICKUP_IMAGE_"))
                .count();
        int optionalPickupPhotos = (int) attachments.stream()
                .filter(attachment -> attachment.getAttachmentType().startsWith("PICKUP_EXTRA_IMAGE_"))
                .count();

        return new ServiceRequestResponse.PickupSummary(
                pickup.getAgent() != null ? pickup.getAgent().getFullName() : null,
                pickup.getAgent() != null ? pickup.getAgent().getPhone() : null,
                pickup.getScheduledAt(),
                pickup.getPickupOtp(),
                pickup.getNotes(),
                pickup.getAcceptedAt(),
                pickup.getCompletedAt(),
                pickup.getRunnerLinkSentAt(),
                pickup.getRunnerPortalToken() != null
                        ? runnerPortalBaseUrl + "/" + pickup.getRunnerPortalToken()
                        : null,
                10,
                requiredPickupPhotos,
                optionalPickupPhotos
        );
    }
}

