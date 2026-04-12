package com.gadgetseva.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class ClaimDocumentResponse {
    private Long id;
    private String documentType;
    private String fileName;
    private String contentType;
    private String objectKey;
    private Long fileSizeBytes;
    private int versionNumber;
    private boolean isCurrent;
    private String uploadedBy;
    private Instant uploadedAt;
}
