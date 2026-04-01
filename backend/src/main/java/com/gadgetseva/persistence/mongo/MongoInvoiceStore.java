package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.Invoice;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.InvoiceStore;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import java.util.Optional;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoInvoiceStore extends AbstractMongoStoreSupport implements InvoiceStore {

    public MongoInvoiceStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public Optional<Invoice> findByServiceRequest(ServiceRequest serviceRequest) {
        Long requestId = extractId(serviceRequest);
        if (requestId == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(mongoTemplate.findOne(Query.query(Criteria.where("serviceRequest.$id").is(requestId)), Invoice.class));
    }

    @Override
    public Invoice save(Invoice invoice) {
        return saveEntity(invoice, Invoice.class);
    }
}