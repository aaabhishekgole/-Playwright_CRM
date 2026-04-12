package com.gadgetseva.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateClaimRequest {
    @NotNull
    private Long serviceRequestId;
    private String imeiNumber;
    private String serialNumber;
}
