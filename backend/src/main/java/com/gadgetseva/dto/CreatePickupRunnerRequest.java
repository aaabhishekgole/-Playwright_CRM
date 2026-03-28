package com.gadgetseva.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePickupRunnerRequest(
        @NotBlank
        @Size(max = 120)
        String fullName,
        @NotBlank
        @Size(max = 20)
        String phone,
        @Size(max = 20)
        String whatsappNumber,
        @Email
        @Size(max = 120)
        String email,
        @Size(max = 80)
        String username,
        Boolean active
) {
}
