package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.BaseAuditableEntity;
import java.lang.reflect.Field;
import java.time.Instant;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.util.ReflectionUtils;

abstract class AbstractMongoStoreSupport {

    protected final MongoTemplate mongoTemplate;
    private final MongoSequenceService mongoSequenceService;

    protected AbstractMongoStoreSupport(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        this.mongoTemplate = mongoTemplate;
        this.mongoSequenceService = mongoSequenceService;
    }

    protected <T> T saveEntity(T entity, Class<T> entityType) {
        assignIdIfNecessary(entity, entityType);
        applyAuditTimestamps(entity);
        return mongoTemplate.save(entity);
    }

    protected Long extractId(Object entity) {
        if (entity == null) {
            return null;
        }
        Field field = ReflectionUtils.findField(entity.getClass(), "id");
        if (field == null) {
            return null;
        }
        ReflectionUtils.makeAccessible(field);
        Object value = ReflectionUtils.getField(field, entity);
        return value instanceof Long longValue ? longValue : null;
    }

    private <T> void assignIdIfNecessary(T entity, Class<T> entityType) {
        Field field = ReflectionUtils.findField(entityType, "id");
        if (field == null) {
            return;
        }
        ReflectionUtils.makeAccessible(field);
        Object existing = ReflectionUtils.getField(field, entity);
        if (existing == null) {
            ReflectionUtils.setField(field, entity, mongoSequenceService.nextId(mongoTemplate.getCollectionName(entityType)));
        }
    }

    private void applyAuditTimestamps(Object entity) {
        if (!(entity instanceof BaseAuditableEntity auditableEntity)) {
            return;
        }
        Instant now = Instant.now();
        if (auditableEntity.getCreatedAt() == null) {
            auditableEntity.setCreatedAt(now);
        }
        auditableEntity.setUpdatedAt(now);
    }
}