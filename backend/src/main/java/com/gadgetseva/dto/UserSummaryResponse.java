package com.gadgetseva.dto;

public record UserSummaryResponse(
        Long id,
        String fullName,
        String username,
        String role,
        String tenantCode,
        boolean active
) {
}
