package com.gadgetseva.dto;

public record DeviceScanResponse(
        String extractedImei,
        boolean valid,
        String validationStatus,
        String sourcePayload
) {
}