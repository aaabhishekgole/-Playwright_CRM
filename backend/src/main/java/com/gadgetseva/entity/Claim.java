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
@Document(collection = "claims")
@Table(name = "claims")
public class Claim extends BaseAuditableEntity {

    @Id
    private Long id;

    /** MongoDB: store the service request ID by reference (no JPA join in Mongo mode). */
    private Long serviceRequestId;

    @Column(nullable = false, unique = true, length = 30)
    private String claimNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ClaimStatus claimStatus = ClaimStatus.CLAIM_SUBMITTED;

    @Column(length = 20)
    private String imeiNumber;

    @Column(length = 50)
    private String serialNumber;

    @Column(nullable = false)
    private boolean imeiVerified = false;

    @Column(length = 120)
    private String imeiVerifiedBy;

    private Instant imeiVerifiedAt;

    @Column(columnDefinition = "TEXT")
    private String imeiVerificationNote;

    @Column(precision = 12, scale = 2)
    private BigDecimal approvedAmount;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(nullable = false)
    private int reuploadAttemptCount = 0;

    @Column(nullable = false)
    private int maxReuploadAttempts = 3;

    @Column(nullable = false)
    private boolean lockedForAdmin = false;

    @Column(nullable = false)
    private Instant submittedAt = Instant.now();

    private Instant approvedAt;
    private Instant rejectedAt;
    private Instant closedAt;
}
