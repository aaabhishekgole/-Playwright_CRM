package com.gadgetseva.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Entity
@Document(collection = "insurance_submissions")
@Table(name = "insurance_submissions")
public class InsuranceSubmission extends BaseAuditableEntity {

    @Id
    private Long id;

    /** MongoDB: reference by ID instead of JPA join. */
    private Long claimId;

    @Column(nullable = false, length = 40)
    private String subStatus = "READY_FOR_INSURANCE";

    @Column(length = 120)
    private String submittedBy;

    private Instant submittedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
