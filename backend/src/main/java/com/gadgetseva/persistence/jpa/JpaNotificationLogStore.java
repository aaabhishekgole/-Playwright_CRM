package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.NotificationDeliveryStatus;
import com.gadgetseva.entity.NotificationLog;
import com.gadgetseva.persistence.JpaPersistenceAdapter;
import com.gadgetseva.persistence.NotificationLogStore;
import com.gadgetseva.repository.NotificationLogRepository;
import java.time.Instant;
import java.util.Collection;
import java.util.List;

@JpaPersistenceAdapter
public class JpaNotificationLogStore implements NotificationLogStore {

    private final NotificationLogRepository notificationLogRepository;

    public JpaNotificationLogStore(NotificationLogRepository notificationLogRepository) {
        this.notificationLogRepository = notificationLogRepository;
    }

    @Override
    public NotificationLog save(NotificationLog notificationLog) {
        return notificationLogRepository.save(notificationLog);
    }

    @Override
    public List<NotificationLog> findByServiceRequestIdOrderByCreatedAtDesc(Long serviceRequestId) {
        return notificationLogRepository.findByServiceRequestIdOrderByCreatedAtDesc(serviceRequestId);
    }

    @Override
    public List<NotificationLog> findTop50ByChannelAndRecipientOrderByCreatedAtDesc(String channel, String recipient) {
        return notificationLogRepository.findTop50ByChannelAndRecipientOrderByCreatedAtDesc(channel, recipient);
    }

    @Override
    public List<NotificationLog> findTop20ByDeliveryStatusInAndNextRetryAtBeforeOrderByCreatedAtAsc(Collection<NotificationDeliveryStatus> statuses, Instant nextRetryAt) {
        return notificationLogRepository.findTop20ByDeliveryStatusInAndNextRetryAtBeforeOrderByCreatedAtAsc(statuses, nextRetryAt);
    }
}