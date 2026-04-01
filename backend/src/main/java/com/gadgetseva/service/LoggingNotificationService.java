package com.gadgetseva.service;

import com.gadgetseva.entity.NotificationDeliveryStatus;
import com.gadgetseva.entity.NotificationLog;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.NotificationLogStore;
import com.gadgetseva.persistence.ServiceRequestStore;
import java.time.Instant;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LoggingNotificationService implements NotificationService {

    private final NotificationLogStore notificationLogStore;
    private final ServiceRequestStore serviceRequestStore;
    private final RoutingNotificationDeliveryGateway routingNotificationDeliveryGateway;

    public LoggingNotificationService(NotificationLogStore notificationLogStore,
                                      ServiceRequestStore serviceRequestStore,
                                      RoutingNotificationDeliveryGateway routingNotificationDeliveryGateway) {
        this.notificationLogStore = notificationLogStore;
        this.serviceRequestStore = serviceRequestStore;
        this.routingNotificationDeliveryGateway = routingNotificationDeliveryGateway;
    }

    @Override
    public void queueStatusUpdate(ServiceRequest serviceRequest, String subject, String message) {
        String recipient = resolveRecipient(serviceRequest);
        queueAlert(serviceRequest, recipient, subject, message);
    }

    @Override
    public void queueAlert(ServiceRequest serviceRequest, String recipient, String subject, String message) {
        queueNotification(serviceRequest, resolveChannel(serviceRequest, recipient), recipient, subject, message,
                "{\"serviceRequestId\":" + serviceRequest.getId() + "}");
    }

    @Override
    public void queueNotification(ServiceRequest serviceRequest,
                                  String channel,
                                  String recipient,
                                  String subject,
                                  String message,
                                  String payloadJson) {
        NotificationLog logEntry = new NotificationLog();
        logEntry.setServiceRequestId(serviceRequest.getId());
        logEntry.setTenant(serviceRequest.getTenant());
        logEntry.setChannel(channel);
        logEntry.setRecipient(recipient);
        logEntry.setSubject(subject);
        logEntry.setMessage(message);
        logEntry.setDeliveryStatus(NotificationDeliveryStatus.QUEUED);
        logEntry.setCreatedAt(Instant.now());
        logEntry.setAttemptCount(0);
        logEntry.setMaxAttempts(3);
        logEntry.setNextRetryAt(Instant.now());
        logEntry.setPayloadJson(payloadJson);
        notificationLogStore.save(logEntry);
    }

    @Override
    public List<NotificationLog> listForRequest(Long serviceRequestId) {
        return notificationLogStore.findByServiceRequestIdOrderByCreatedAtDesc(serviceRequestId);
    }

    @Scheduled(fixedDelay = 60000)
    public void processQueue() {
        List<NotificationLog> dueItems = notificationLogStore.findTop20ByDeliveryStatusInAndNextRetryAtBeforeOrderByCreatedAtAsc(
                List.of(NotificationDeliveryStatus.QUEUED, NotificationDeliveryStatus.RETRYING),
                Instant.now().plusSeconds(1)
        );
        for (NotificationLog item : dueItems) {
            try {
                item.setAttemptCount(item.getAttemptCount() + 1);
                ServiceRequest serviceRequest = item.getServiceRequestId() != null
                        ? serviceRequestStore.findById(item.getServiceRequestId()).orElse(null)
                        : null;
                NotificationDeliveryGateway.DeliveryResult deliveryResult = routingNotificationDeliveryGateway.deliver(item, serviceRequest);
                if (deliveryResult.delivered()) {
                    item.setDeliveryStatus(NotificationDeliveryStatus.SENT);
                    item.setErrorMessage(null);
                    notificationLogStore.save(item);
                    log.info("Delivered {} notification {} to {}", item.getChannel(), item.getId(), item.getRecipient());
                    continue;
                }

                item.setErrorMessage(deliveryResult.errorMessage());
                if (item.getAttemptCount() >= item.getMaxAttempts()) {
                    item.setDeliveryStatus(NotificationDeliveryStatus.DEAD_LETTER);
                } else {
                    item.setDeliveryStatus(NotificationDeliveryStatus.RETRYING);
                    item.setNextRetryAt(Instant.now().plusSeconds(item.getAttemptCount() * 300L));
                }
                notificationLogStore.save(item);
            } catch (Exception exception) {
                item.setErrorMessage(exception.getMessage());
                if (item.getAttemptCount() >= item.getMaxAttempts()) {
                    item.setDeliveryStatus(NotificationDeliveryStatus.DEAD_LETTER);
                } else {
                    item.setDeliveryStatus(NotificationDeliveryStatus.RETRYING);
                    item.setNextRetryAt(Instant.now().plusSeconds(item.getAttemptCount() * 300L));
                }
                notificationLogStore.save(item);
            }
        }
    }

    private String resolveRecipient(ServiceRequest serviceRequest) {
        String phone = serviceRequest.getCustomer().getPhone();
        String email = serviceRequest.getCustomer().getEmail();
        if ("WHATSAPP".equalsIgnoreCase(serviceRequest.getSourceChannel()) && phone != null && !phone.isBlank()) {
            return phone;
        }
        if (email != null && !email.isBlank()) {
            return email;
        }
        return phone;
    }

    private String resolveChannel(ServiceRequest serviceRequest, String recipient) {
        if (recipient == null || recipient.isBlank()) {
            return "SMS";
        }
        if (recipient.contains("@")) {
            return "EMAIL";
        }
        if ("WHATSAPP".equalsIgnoreCase(serviceRequest.getSourceChannel())) {
            return "WHATSAPP";
        }
        return "SMS";
    }
}
