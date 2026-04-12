package com.gadgetseva.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data
public class ClaimApprovalLogResponse {
    private Long id;
    private String action;
    private String actionBy;
    private Instant actionAt;
    private String remarks;
    private BigDecimal approvedAmount;
    private String rejectionReason;
}
