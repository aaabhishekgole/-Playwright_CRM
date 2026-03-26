package com.gadgetseva.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateInvoiceRequest(
        String customerGstin,
        @NotBlank String billingStateCode,
        @NotBlank String placeOfSupply,
        @NotNull @DecimalMin("0.0") BigDecimal gstRate,
        @NotBlank String laborDescription,
        String partsDescription
) {
}