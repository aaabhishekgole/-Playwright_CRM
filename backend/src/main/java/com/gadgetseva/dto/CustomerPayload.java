package com.gadgetseva.dto;

import jakarta.validation.constraints.NotBlank;

public record CustomerPayload(
        @NotBlank String fullName,
        String email,
        @NotBlank String phone,
        @NotBlank String addressLine1,
        String addressLine2,
        @NotBlank String city,
        @NotBlank String state,
        @NotBlank String postalCode
) {
}
