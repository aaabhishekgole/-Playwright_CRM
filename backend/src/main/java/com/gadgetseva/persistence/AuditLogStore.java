package com.gadgetseva.persistence;

import com.gadgetseva.entity.AuditLog;
import java.util.List;

public interface AuditLogStore {

    AuditLog save(AuditLog auditLog);

    List<AuditLog> findByServiceRequestIdOrderByChangedAtDesc(Long serviceRequestId);
}