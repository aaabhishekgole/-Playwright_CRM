package com.gadgetseva.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
public class ClaimResponse {
    private Long id;
    private Long serviceRequestId;
    private String requestNumber;
    private String customerName;
    private String deviceLabel;
    private String claimNumber;
    private String claimStatus;
    private String imeiNumber;
    private String serialNumber;
    private boolean imeiVerified;
    private String imeiVerificationNote;
    private BigDecimal approvedAmount;
    private String rejectionReason;
    private int reuploadAttemptCount;
    private int maxReuploadAttempts;
    private boolean lockedForAdmin;
    private Instant submittedAt;
    private Instant approvedAt;
    private Instant rejectedAt;
    private Instant closedAt;
    private List<ClaimDocumentResponse> documents;
    private List<ClaimApprovalLogResponse> approvalLogs;
    private InvoiceVerificationResponse invoiceVerification;
    private InsuranceSubmissionResponse insuranceSubmission;
}
