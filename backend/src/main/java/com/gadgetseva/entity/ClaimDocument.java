package com.gadgetseva.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Entity
@Document(collection = "claim_documents")
@Table(name = "claim_documents")
public class ClaimDocument {

    @Id
    private Long id;

    /** MongoDB: reference by ID instead of JPA join. */
    private Long claimId;

    @Column(nullable = false, length = 60)
    private String documentType;

    @Column(nullable = false, length = 255)
    private String fileName;

    @Column(length = 100)
    private String contentType;

    @Column(nullable = false, length = 500)
    private String objectKey;

    private Long fileSizeBytes;

    @Column(length = 64)
    private String checksum;

    @Column(nullable = false)
    private int versionNumber = 1;

    @Column(nullable = false)
    private boolean isCurrent = true;

    @Column(length = 120)
    private String uploadedBy;

    @Column(nullable = false)
    private Instant uploadedAt = Instant.now();
}
