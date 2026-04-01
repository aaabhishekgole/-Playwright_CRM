package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.Role;
import com.gadgetseva.entity.RoleName;
import com.gadgetseva.entity.User;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import com.gadgetseva.persistence.UserStore;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoUserStore extends AbstractMongoStoreSupport implements UserStore {

    public MongoUserStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return Optional.ofNullable(mongoTemplate.findOne(Query.query(Criteria.where("username").is(username)), User.class));
    }

    @Override
    public Optional<User> findByEmailIgnoreCase(String email) {
        String pattern = "^" + Pattern.quote(email) + "$";
        return Optional.ofNullable(mongoTemplate.findOne(Query.query(Criteria.where("email").regex(pattern, "i")), User.class));
    }

    @Override
    public Optional<User> findByPhone(String phone) {
        return Optional.ofNullable(mongoTemplate.findOne(Query.query(Criteria.where("phone").is(phone)), User.class));
    }

    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(mongoTemplate.findById(id, User.class));
    }

    @Override
    public List<User> findAllOrderByFullNameAsc() {
        return mongoTemplate.find(new Query().with(Sort.by(Sort.Direction.ASC, "fullName")), User.class);
    }

    @Override
    public List<User> findActiveOrderByFullNameAsc() {
        return mongoTemplate.find(Query.query(Criteria.where("active").is(true)).with(Sort.by(Sort.Direction.ASC, "fullName")), User.class);
    }

    @Override
    public List<User> findByRoleOrderByFullNameAsc(RoleName roleName) {
        Long roleId = resolveRoleId(roleName);
        if (roleId == null) {
            return List.of();
        }
        return mongoTemplate.find(Query.query(Criteria.where("role.$id").is(roleId)).with(Sort.by(Sort.Direction.ASC, "fullName")), User.class);
    }

    @Override
    public List<User> findActiveByRoleOrderByFullNameAsc(RoleName roleName) {
        Long roleId = resolveRoleId(roleName);
        if (roleId == null) {
            return List.of();
        }
        Criteria criteria = Criteria.where("role.$id").is(roleId).and("active").is(true);
        return mongoTemplate.find(Query.query(criteria).with(Sort.by(Sort.Direction.ASC, "fullName")), User.class);
    }

    @Override
    public User save(User user) {
        return saveEntity(user, User.class);
    }

    private Long resolveRoleId(RoleName roleName) {
        Role role = mongoTemplate.findOne(Query.query(Criteria.where("name").is(roleName)), Role.class);
        return extractId(role);
    }
}