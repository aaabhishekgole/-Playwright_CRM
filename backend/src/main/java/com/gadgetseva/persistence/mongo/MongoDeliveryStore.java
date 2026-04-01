package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.Delivery;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.DeliveryStore;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import java.util.Optional;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoDeliveryStore extends AbstractMongoStoreSupport implements DeliveryStore {

    public MongoDeliveryStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public Optional<Delivery> findByServiceRequest(ServiceRequest serviceRequest) {
        Long requestId = extractId(serviceRequest);
        if (requestId == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(mongoTemplate.findOne(Query.query(Criteria.where("serviceRequest.$id").is(requestId)), Delivery.class));
    }

    @Override
    public Delivery save(Delivery delivery) {
        return saveEntity(delivery, Delivery.class);
    }
}