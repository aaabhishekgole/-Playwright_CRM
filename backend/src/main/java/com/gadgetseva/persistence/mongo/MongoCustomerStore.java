package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.Customer;
import com.gadgetseva.persistence.CustomerStore;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import org.springframework.data.mongodb.core.MongoTemplate;

@MongoPersistenceAdapter
public class MongoCustomerStore extends AbstractMongoStoreSupport implements CustomerStore {

    public MongoCustomerStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public Customer save(Customer customer) {
        return saveEntity(customer, Customer.class);
    }
}