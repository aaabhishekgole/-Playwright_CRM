package com.gadgetseva.dto;

import com.gadgetseva.entity.PaymentReconciliationStatus;
import jakarta.validation.constraints.NotNull;

public record ReconcilePaymentRequest(
        @NotNull PaymentReconciliationStatus reconciliationStatus,
        String remarks
) {
}
