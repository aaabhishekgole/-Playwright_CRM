package com.gadgetseva.dto;

import jakarta.validation.constraints.NotBlank;

public record DeviceScanRequest(@NotBlank String qrCodePayload) {
}