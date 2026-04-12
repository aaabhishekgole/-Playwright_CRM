package com.gadgetseva.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data
public class InvoiceVerificationResponse {
    private Long id;
    private String invoiceStatus;
    private BigDecimal invoiceAmount;
    private BigDecimal approvedAmount;
    private BigDecimal excessAmount;
    private boolean excessProofUploaded;
    private boolean approvalThresholdBreached;
    private boolean adminApprovalRequired;
    private String rejectionReason;
    private int reuploadAttemptCount;
    private Instant submittedAt;
    private Instant approvedAt;
    private Instant rejectedAt;
}
