package com.gadgetseva.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class SubmitInvoiceRequest {
    @NotNull
    private BigDecimal invoiceAmount;
    private boolean excessPaymentMade;
    private String notes;
}
