package com.gadgetseva.persistence;

import com.gadgetseva.entity.NotificationDeliveryStatus;
import com.gadgetseva.entity.NotificationLog;
import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface NotificationLogStore {

    NotificationLog save(NotificationLog notificationLog);

    List<NotificationLog> findByServiceRequestIdOrderByCreatedAtDesc(Long serviceRequestId);

    List<NotificationLog> findTop50ByChannelAndRecipientOrderByCreatedAtDesc(String channel, String recipient);

    List<NotificationLog> findTop20ByDeliveryStatusInAndNextRetryAtBeforeOrderByCreatedAtAsc(Collection<NotificationDeliveryStatus> statuses, Instant nextRetryAt);
}