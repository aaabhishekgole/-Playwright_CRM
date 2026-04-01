package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.RequestStatus;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import com.gadgetseva.persistence.ServiceRequestStore;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoServiceRequestStore extends AbstractMongoStoreSupport implements ServiceRequestStore {

    public MongoServiceRequestStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public ServiceRequest save(ServiceRequest serviceRequest) {
        return saveEntity(serviceRequest, ServiceRequest.class);
    }

    @Override
    public Optional<ServiceRequest> findById(Long id) {
        return Optional.ofNullable(mongoTemplate.findById(id, ServiceRequest.class));
    }

    @Override
    public List<ServiceRequest> findAllOrderByCreatedAtDesc() {
        return mongoTemplate.find(new Query().with(Sort.by(Sort.Direction.DESC, "createdAt")), ServiceRequest.class);
    }

    @Override
    public List<ServiceRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status) {
        return mongoTemplate.find(Query.query(Criteria.where("status").is(status)).with(Sort.by(Sort.Direction.DESC, "createdAt")), ServiceRequest.class);
    }

    @Override
    public List<ServiceRequest> findBySlaBreachedFalseAndStatusNotInAndSlaDeadlineAtBefore(List<RequestStatus> excludedStatuses, Instant deadline) {
        Criteria criteria = Criteria.where("slaBreached").is(false)
                .and("status").nin(excludedStatuses)
                .and("slaDeadlineAt").lte(deadline);
        return mongoTemplate.find(Query.query(criteria), ServiceRequest.class);
    }

    @Override
    public List<ServiceRequest> findAllByPartnerReferenceStartingWithOrderByCreatedAtDesc(String partnerReferencePrefix) {
        String pattern = "^" + Pattern.quote(partnerReferencePrefix);
        return mongoTemplate.find(Query.query(Criteria.where("partnerReference").regex(pattern)).with(Sort.by(Sort.Direction.DESC, "createdAt")), ServiceRequest.class);
    }
}