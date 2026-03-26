package com.gadgetseva.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record AssignPickupRequest(
        @NotNull Long agentId,
        @NotNull @Future Instant scheduledAt,
        String pickupOtp,
        String notes
) {
}
