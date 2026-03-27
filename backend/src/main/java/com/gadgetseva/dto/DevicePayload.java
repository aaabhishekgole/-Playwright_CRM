package com.gadgetseva.dto;

import com.gadgetseva.entity.DeviceCategory;
import jakarta.validation.constraints.NotBlank;

public record DevicePayload(
        @NotBlank String brand,
        @NotBlank String model,
        DeviceCategory deviceCategory,
        @NotBlank String serialNumber,
        String imeiNumber,
        @NotBlank String warrantyStatus,
        String deviceCondition,
        String qrCodePayload
) {
}
