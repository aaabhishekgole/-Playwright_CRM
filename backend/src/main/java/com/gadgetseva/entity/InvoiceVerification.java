package com.gadgetseva.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Document(collection = "invoice_verification")
@Table(name = "invoice_verification")
public class InvoiceVerification extends BaseAuditableEntity {

    @Id
    private Long id;

    /** MongoDB: reference by ID instead of JPA join. */
    private Long claimId;

    @Column(nullable = false, length = 40)
    private String invoiceStatus = "INVOICE_SUBMITTED";

    @Column(precision = 12, scale = 2)
    private BigDecimal invoiceAmount;

    @Column(precision = 12, scale = 2)
    private BigDecimal approvedAmount;

    @Column(precision = 12, scale = 2)
    private BigDecimal excessAmount;

    @Column(nullable = false)
    private boolean excessProofUploaded = false;

    @Column(length = 500)
    private String excessProofUrl;

    @Column(nullable = false)
    private boolean approvalThresholdBreached = false;

    @Column(nullable = false)
    private boolean adminApprovalRequired = false;

    @Column(length = 120)
    private String adminApprovedBy;

    private Instant adminApprovedAt;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(nullable = false)
    private int reuploadAttemptCount = 0;

    @Column(nullable = false)
    private Instant submittedAt = Instant.now();

    private Instant approvedAt;
    private Instant rejectedAt;
}
