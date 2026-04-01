package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.Tenant;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import com.gadgetseva.persistence.TenantStore;
import java.util.Optional;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoTenantStore extends AbstractMongoStoreSupport implements TenantStore {

    public MongoTenantStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public Optional<Tenant> findByCode(String code) {
        return Optional.ofNullable(mongoTemplate.findOne(Query.query(Criteria.where("code").is(code)), Tenant.class));
    }

    @Override
    public Tenant save(Tenant tenant) {
        return saveEntity(tenant, Tenant.class);
    }
}