package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.Invoice;
import com.gadgetseva.entity.InvoiceLineItem;
import com.gadgetseva.persistence.InvoiceLineItemStore;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoInvoiceLineItemStore extends AbstractMongoStoreSupport implements InvoiceLineItemStore {

    public MongoInvoiceLineItemStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public InvoiceLineItem save(InvoiceLineItem invoiceLineItem) {
        return saveEntity(invoiceLineItem, InvoiceLineItem.class);
    }

    @Override
    public List<InvoiceLineItem> findByInvoiceOrderByIdAsc(Invoice invoice) {
        Long invoiceId = extractId(invoice);
        if (invoiceId == null) {
            return List.of();
        }
        return mongoTemplate.find(Query.query(Criteria.where("invoice.$id").is(invoiceId)).with(Sort.by(Sort.Direction.ASC, "_id")), InvoiceLineItem.class);
    }
}