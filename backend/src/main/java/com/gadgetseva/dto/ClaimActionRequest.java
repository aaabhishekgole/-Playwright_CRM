package com.gadgetseva.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ClaimActionRequest {
    private String remarks;
    private BigDecimal approvedAmount;
    private String rejectionReason;
    private Boolean imeiVerified;
    private String imeiVerificationNote;
}
