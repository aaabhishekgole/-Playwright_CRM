package com.gadgetseva.repository;

import com.gadgetseva.entity.NotificationDeliveryStatus;
import com.gadgetseva.entity.NotificationLog;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
    List<NotificationLog> findByServiceRequestIdOrderByCreatedAtDesc(Long serviceRequestId);
    List<NotificationLog> findTop20ByDeliveryStatusInAndNextRetryAtBeforeOrderByCreatedAtAsc(Collection<NotificationDeliveryStatus> statuses, Instant nextRetryAt);
}