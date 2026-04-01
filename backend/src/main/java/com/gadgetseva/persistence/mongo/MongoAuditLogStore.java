package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.AuditLog;
import com.gadgetseva.persistence.AuditLogStore;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoAuditLogStore extends AbstractMongoStoreSupport implements AuditLogStore {

    public MongoAuditLogStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public AuditLog save(AuditLog auditLog) {
        return saveEntity(auditLog, AuditLog.class);
    }

    @Override
    public List<AuditLog> findByServiceRequestIdOrderByChangedAtDesc(Long serviceRequestId) {
        return mongoTemplate.find(Query.query(Criteria.where("serviceRequestId").is(serviceRequestId)).with(Sort.by(Sort.Direction.DESC, "changedAt")), AuditLog.class);
    }
}