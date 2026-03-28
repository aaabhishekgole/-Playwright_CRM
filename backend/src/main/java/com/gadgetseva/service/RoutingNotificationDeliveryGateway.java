package com.gadgetseva.service;

import com.gadgetseva.config.NotificationProperties;
import com.gadgetseva.entity.NotificationLog;
import com.gadgetseva.entity.ServiceRequest;
import org.springframework.stereotype.Component;

@Component
public class RoutingNotificationDeliveryGateway implements NotificationDeliveryGateway {

    private final NotificationProperties notificationProperties;
    private final LoggingNotificationDeliveryGateway loggingNotificationDeliveryGateway;
    private final HttpNotificationDeliveryGateway httpNotificationDeliveryGateway;

    public RoutingNotificationDeliveryGateway(NotificationProperties notificationProperties,
                                              LoggingNotificationDeliveryGateway loggingNotificationDeliveryGateway,
                                              HttpNotificationDeliveryGateway httpNotificationDeliveryGateway) {
        this.notificationProperties = notificationProperties;
        this.loggingNotificationDeliveryGateway = loggingNotificationDeliveryGateway;
        this.httpNotificationDeliveryGateway = httpNotificationDeliveryGateway;
    }

    @Override
    public DeliveryResult deliver(NotificationLog notificationLog, ServiceRequest serviceRequest) {
        return switch (notificationProperties.getProvider()) {
            case HTTP -> {
                if ("SMS".equalsIgnoreCase(notificationLog.getChannel()) || "WHATSAPP".equalsIgnoreCase(notificationLog.getChannel())) {
                    yield httpNotificationDeliveryGateway.deliver(notificationLog, serviceRequest);
                }
                yield loggingNotificationDeliveryGateway.deliver(notificationLog, serviceRequest);
            }
            case LOG -> loggingNotificationDeliveryGateway.deliver(notificationLog, serviceRequest);
        };
    }
}
