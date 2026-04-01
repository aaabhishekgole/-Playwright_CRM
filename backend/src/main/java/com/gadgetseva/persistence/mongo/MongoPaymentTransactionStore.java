package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.PaymentTransaction;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import com.gadgetseva.persistence.PaymentTransactionStore;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoPaymentTransactionStore extends AbstractMongoStoreSupport implements PaymentTransactionStore {

    public MongoPaymentTransactionStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public PaymentTransaction save(PaymentTransaction paymentTransaction) {
        return saveEntity(paymentTransaction, PaymentTransaction.class);
    }

    @Override
    public Optional<PaymentTransaction> findById(Long id) {
        return Optional.ofNullable(mongoTemplate.findById(id, PaymentTransaction.class));
    }

    @Override
    public List<PaymentTransaction> findByServiceRequestOrderByCreatedAtDesc(ServiceRequest serviceRequest) {
        Long requestId = extractId(serviceRequest);
        if (requestId == null) {
            return List.of();
        }
        return mongoTemplate.find(Query.query(Criteria.where("serviceRequest.$id").is(requestId)).with(Sort.by(Sort.Direction.DESC, "createdAt")), PaymentTransaction.class);
    }
}