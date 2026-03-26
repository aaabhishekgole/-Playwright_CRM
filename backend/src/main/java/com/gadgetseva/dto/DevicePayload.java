package com.gadgetseva.dto;

import jakarta.validation.constraints.NotBlank;

public record DevicePayload(
        @NotBlank String brand,
        @NotBlank String model,
        @NotBlank String serialNumber,
        String imeiNumber,
        @NotBlank String warrantyStatus,
        String deviceCondition,
        String qrCodePayload
) {
}