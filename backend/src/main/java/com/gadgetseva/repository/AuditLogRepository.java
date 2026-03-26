package com.gadgetseva.repository;

import com.gadgetseva.entity.AuditLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByServiceRequestIdOrderByChangedAtDesc(Long serviceRequestId);
}