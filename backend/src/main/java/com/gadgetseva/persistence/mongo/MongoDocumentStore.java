package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.DocumentRecord;
import com.gadgetseva.persistence.DocumentStore;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoDocumentStore extends AbstractMongoStoreSupport implements DocumentStore {

    public MongoDocumentStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public DocumentRecord save(DocumentRecord document) {
        return saveEntity(document, DocumentRecord.class);
    }

    @Override
    public List<DocumentRecord> findAllOrderByUploadedAtDesc() {
        Query query = new Query().with(Sort.by(Sort.Direction.DESC, "uploadedAt"));
        return mongoTemplate.find(query, DocumentRecord.class);
    }

    @Override
    public List<DocumentRecord> findByCategoryIgnoreCaseOrderByUploadedAtDesc(String category) {
        Criteria criteria = Criteria.where("category").regex("^" + category + "$", "i");
        Query query = Query.query(criteria).with(Sort.by(Sort.Direction.DESC, "uploadedAt"));
        return mongoTemplate.find(query, DocumentRecord.class);
    }

    @Override
    public Optional<DocumentRecord> findById(long id) {
        return Optional.ofNullable(mongoTemplate.findById(id, DocumentRecord.class));
    }

    @Override
    public void delete(DocumentRecord document) {
        mongoTemplate.remove(Query.query(Criteria.where("_id").is(document.getId())), DocumentRecord.class);
    }
}
