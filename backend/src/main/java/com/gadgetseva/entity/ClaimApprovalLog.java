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
@Document(collection = "claim_approval_logs")
@Table(name = "claim_approval_logs")
public class ClaimApprovalLog {

    @Id
    private Long id;

    /** MongoDB: reference by ID instead of JPA join. */
    private Long claimId;

    @Column(nullable = false, length = 40)
    private String action;

    @Column(length = 120)
    private String actionBy;

    @Column(nullable = false)
    private Instant actionAt = Instant.now();

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(precision = 12, scale = 2)
    private BigDecimal approvedAmount;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;
}
