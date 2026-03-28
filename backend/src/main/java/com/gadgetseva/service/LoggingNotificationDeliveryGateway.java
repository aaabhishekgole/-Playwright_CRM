package com.gadgetseva.service;

import com.gadgetseva.entity.NotificationLog;
import com.gadgetseva.entity.ServiceRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class LoggingNotificationDeliveryGateway implements NotificationDeliveryGateway {

    @Override
    public DeliveryResult deliver(NotificationLog notificationLog, ServiceRequest serviceRequest) {
        log.info("Delivered {} notification {} to {} for request {}",
                notificationLog.getChannel(),
                notificationLog.getId(),
                notificationLog.getRecipient(),
                serviceRequest != null ? serviceRequest.getRequestNumber() : notificationLog.getServiceRequestId());
        return DeliveryResult.success();
    }
}
