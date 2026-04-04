package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.AuditLog;
import com.gadgetseva.persistence.AuditLogStore;
import com.gadgetseva.persistence.JpaPersistenceAdapter;
import com.gadgetseva.repository.jpa.AuditLogRepository;
import java.util.List;

@JpaPersistenceAdapter
public class JpaAuditLogStore implements AuditLogStore {

    private final AuditLogRepository auditLogRepository;

    public JpaAuditLogStore(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public AuditLog save(AuditLog auditLog) {
        return auditLogRepository.save(auditLog);
    }

    @Override
    public List<AuditLog> findByServiceRequestIdOrderByChangedAtDesc(Long serviceRequestId) {
        return auditLogRepository.findByServiceRequestIdOrderByChangedAtDesc(serviceRequestId);
    }
}
