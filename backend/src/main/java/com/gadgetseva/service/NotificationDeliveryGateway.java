package com.gadgetseva.service;

import com.gadgetseva.entity.NotificationLog;
import com.gadgetseva.entity.ServiceRequest;

public interface NotificationDeliveryGateway {
    DeliveryResult deliver(NotificationLog notificationLog, ServiceRequest serviceRequest);

    record DeliveryResult(boolean delivered, String errorMessage) {
        public static DeliveryResult success() {
            return new DeliveryResult(true, null);
        }

        public static DeliveryResult failure(String errorMessage) {
            return new DeliveryResult(false, errorMessage);
        }
    }
}
