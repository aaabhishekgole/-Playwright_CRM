package com.gadgetseva.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gadgetseva.entity.AuditLog;
import com.gadgetseva.entity.User;
import com.gadgetseva.repository.AuditLogRepository;
import java.time.Instant;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AuditTrailService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditTrailService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    public void logChange(String entityName, Long entityId, Long serviceRequestId, String action, Object before, Object after, User changedBy) {
        AuditLog logEntry = new AuditLog();
        logEntry.setEntityName(entityName);
        logEntry.setEntityId(entityId);
        logEntry.setServiceRequestId(serviceRequestId);
        logEntry.setAction(action);
        logEntry.setBeforeJson(toJson(before));
        logEntry.setAfterJson(toJson(after));
        logEntry.setChangedBy(changedBy);
        logEntry.setChangedAt(Instant.now());
        auditLogRepository.save(logEntry);
    }

    public List<AuditLog> listForRequest(Long serviceRequestId) {
        return auditLogRepository.findByServiceRequestIdOrderByChangedAtDesc(serviceRequestId);
    }

    public String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            log.warn("Failed to serialize audit payload", exception);
            return String.valueOf(value);
        }
    }
}