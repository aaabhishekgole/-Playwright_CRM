package com.gadgetseva.dto;

public record UserSummaryResponse(
        Long id,
        String fullName,
        String username,
        String email,
        String phone,
        String whatsappNumber,
        String role,
        String tenantCode,
        boolean active
) {
}
