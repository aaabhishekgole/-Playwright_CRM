package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.Role;
import com.gadgetseva.entity.RoleName;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import com.gadgetseva.persistence.RoleStore;
import java.util.Optional;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoRoleStore extends AbstractMongoStoreSupport implements RoleStore {

    public MongoRoleStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public Optional<Role> findByName(RoleName roleName) {
        return Optional.ofNullable(mongoTemplate.findOne(Query.query(Criteria.where("name").is(roleName)), Role.class));
    }

    @Override
    public Role save(Role role) {
        return saveEntity(role, Role.class);
    }
}