package com.gadgetseva.persistence.mongo;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.persistence.type", havingValue = "mongo")
public class MongoSequenceService {

    private final MongoTemplate mongoTemplate;

    public MongoSequenceService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public long nextId(String sequenceName) {
        Query query = Query.query(Criteria.where("_id").is(sequenceName));
        Update update = new Update().inc("value", 1L);
        FindAndModifyOptions options = FindAndModifyOptions.options().upsert(true).returnNew(true);
        MongoSequenceCounter counter = mongoTemplate.findAndModify(query, update, options, MongoSequenceCounter.class);
        if (counter == null) {
            throw new IllegalStateException("Unable to generate sequence for " + sequenceName);
        }
        return counter.getValue();
    }
}