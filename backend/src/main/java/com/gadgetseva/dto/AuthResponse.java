package com.gadgetseva.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        String username,
        String role,
        String fullName,
        String phone
) {
}
