package com.gadgetseva.dto;

import jakarta.validation.constraints.NotBlank;

public record CustomerPayload(
        @NotBlank String fullName,
        String contactPerson,
        String email,
        String secondaryEmail,
        @NotBlank String phone,
        String alternatePhone,
        String whatsappNumber,
        @NotBlank String addressLine1,
        String addressLine2,
        String landmark,
        String googleMapLink,
        @NotBlank String city,
        @NotBlank String state,
        @NotBlank String postalCode
) {
}
