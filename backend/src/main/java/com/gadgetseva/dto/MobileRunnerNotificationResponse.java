package com.gadgetseva.dto;

import java.time.Instant;

public record MobileRunnerNotificationResponse(
        Long id,
        String channel,
        String subject,
        String message,
        String deliveryStatus,
        Instant createdAt,
        Long serviceRequestId,
        String requestNumber,
        String customerName,
        String deviceLabel,
        String requestStatus,
        Instant scheduledAt,
        String runnerPortalToken
) {
}
