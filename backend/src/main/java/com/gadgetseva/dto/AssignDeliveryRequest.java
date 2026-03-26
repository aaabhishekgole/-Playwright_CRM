package com.gadgetseva.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record AssignDeliveryRequest(
        @NotNull Long agentId,
        @NotNull @Future Instant scheduledAt,
        String otpCode,
        String notes
) {
}
