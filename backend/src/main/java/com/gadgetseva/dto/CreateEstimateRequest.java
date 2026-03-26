package com.gadgetseva.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateEstimateRequest(
        @NotBlank String diagnosisSummary,
        @NotNull @DecimalMin("0.0") BigDecimal partsCost,
        @NotNull @DecimalMin("0.0") BigDecimal laborCost,
        @NotNull @DecimalMin("0.0") BigDecimal taxAmount
) {
}
