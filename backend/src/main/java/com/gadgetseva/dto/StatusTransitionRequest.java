package com.gadgetseva.dto;

import com.gadgetseva.entity.RequestStatus;
import jakarta.validation.constraints.NotNull;

public record StatusTransitionRequest(
        @NotNull RequestStatus targetStatus,
        String remarks
) {
}
