package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.Pickup;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import com.gadgetseva.persistence.PickupStore;
import java.util.Optional;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoPickupStore extends AbstractMongoStoreSupport implements PickupStore {

    public MongoPickupStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public Optional<Pickup> findByServiceRequest(ServiceRequest serviceRequest) {
        Long requestId = extractId(serviceRequest);
        if (requestId == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(mongoTemplate.findOne(Query.query(Criteria.where("serviceRequest.$id").is(requestId)), Pickup.class));
    }

    @Override
    public Optional<Pickup> findByRunnerPortalToken(String runnerPortalToken) {
        return Optional.ofNullable(mongoTemplate.findOne(Query.query(Criteria.where("runnerPortalToken").is(runnerPortalToken)), Pickup.class));
    }

    @Override
    public Pickup save(Pickup pickup) {
        return saveEntity(pickup, Pickup.class);
    }
}