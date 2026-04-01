package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.Estimate;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.EstimateStore;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import java.util.Optional;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoEstimateStore extends AbstractMongoStoreSupport implements EstimateStore {

    public MongoEstimateStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public Optional<Estimate> findByServiceRequest(ServiceRequest serviceRequest) {
        Long requestId = extractId(serviceRequest);
        if (requestId == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(mongoTemplate.findOne(Query.query(Criteria.where("serviceRequest.$id").is(requestId)), Estimate.class));
    }

    @Override
    public Estimate save(Estimate estimate) {
        return saveEntity(estimate, Estimate.class);
    }
}