package com.gadgetseva.service;

import com.gadgetseva.entity.NotificationDeliveryStatus;
import com.gadgetseva.entity.NotificationLog;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.repository.NotificationLogRepository;
import java.time.Instant;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LoggingNotificationService implements NotificationService {

    private final NotificationLogRepository notificationLogRepository;

    public LoggingNotificationService(NotificationLogRepository notificationLogRepository) {
        this.notificationLogRepository = notificationLogRepository;
    }

    @Override
    public void queueStatusUpdate(ServiceRequest serviceRequest, String subject, String message) {
        String recipient = resolveRecipient(serviceRequest);
        queueAlert(serviceRequest, recipient, subject, message);
    }

    @Override
    public void queueAlert(ServiceRequest serviceRequest, String recipient, String subject, String message) {
        NotificationLog logEntry = new NotificationLog();
        logEntry.setServiceRequestId(serviceRequest.getId());
        logEntry.setTenant(serviceRequest.getTenant());
        logEntry.setChannel(resolveChannel(serviceRequest, recipient));
        logEntry.setRecipient(recipient);
        logEntry.setSubject(subject);
        logEntry.setMessage(message);
        logEntry.setDeliveryStatus(NotificationDeliveryStatus.QUEUED);
        logEntry.setCreatedAt(Instant.now());
        logEntry.setAttemptCount(0);
        logEntry.setMaxAttempts(3);
        logEntry.setNextRetryAt(Instant.now());
        logEntry.setPayloadJson("{\"serviceRequestId\":" + serviceRequest.getId() + "}");
        notificationLogRepository.save(logEntry);
    }

    @Override
    public List<NotificationLog> listForRequest(Long serviceRequestId) {
        return notificationLogRepository.findByServiceRequestIdOrderByCreatedAtDesc(serviceRequestId);
    }

    @Scheduled(fixedDelay = 60000)
    public void processQueue() {
        List<NotificationLog> dueItems = notificationLogRepository.findTop20ByDeliveryStatusInAndNextRetryAtBeforeOrderByCreatedAtAsc(
                List.of(NotificationDeliveryStatus.QUEUED, NotificationDeliveryStatus.RETRYING),
                Instant.now().plusSeconds(1)
        );
        for (NotificationLog item : dueItems) {
            try {
                item.setAttemptCount(item.getAttemptCount() + 1);
                item.setDeliveryStatus(NotificationDeliveryStatus.SENT);
                item.setErrorMessage(null);
                notificationLogRepository.save(item);
                log.info("Delivered {} notification {} to {}", item.getChannel(), item.getId(), item.getRecipient());
            } catch (Exception exception) {
                item.setErrorMessage(exception.getMessage());
                if (item.getAttemptCount() >= item.getMaxAttempts()) {
                    item.setDeliveryStatus(NotificationDeliveryStatus.DEAD_LETTER);
                } else {
                    item.setDeliveryStatus(NotificationDeliveryStatus.RETRYING);
                    item.setNextRetryAt(Instant.now().plusSeconds(item.getAttemptCount() * 300L));
                }
                notificationLogRepository.save(item);
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
