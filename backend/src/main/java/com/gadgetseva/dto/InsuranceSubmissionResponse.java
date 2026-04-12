package com.gadgetseva.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class InsuranceSubmissionResponse {
    private Long id;
    private String subStatus;
    private String submittedBy;
    private Instant submittedAt;
    private String notes;
}
