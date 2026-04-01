package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.entity.StatusHistory;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import com.gadgetseva.persistence.StatusHistoryStore;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoStatusHistoryStore extends AbstractMongoStoreSupport implements StatusHistoryStore {

    public MongoStatusHistoryStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public StatusHistory save(StatusHistory statusHistory) {
        return saveEntity(statusHistory, StatusHistory.class);
    }

    @Override
    public List<StatusHistory> findByServiceRequestOrderByChangedAtAsc(ServiceRequest serviceRequest) {
        Long requestId = extractId(serviceRequest);
        if (requestId == null) {
            return List.of();
        }
        return mongoTemplate.find(Query.query(Criteria.where("serviceRequest.$id").is(requestId)).with(Sort.by(Sort.Direction.ASC, "changedAt")), StatusHistory.class);
    }
}