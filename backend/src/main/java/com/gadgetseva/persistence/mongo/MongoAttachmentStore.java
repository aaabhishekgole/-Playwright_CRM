package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.Attachment;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.AttachmentStore;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoAttachmentStore extends AbstractMongoStoreSupport implements AttachmentStore {

    public MongoAttachmentStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public Attachment save(Attachment attachment) {
        return saveEntity(attachment, Attachment.class);
    }

    @Override
    public List<Attachment> findByServiceRequest(ServiceRequest serviceRequest) {
        Long requestId = extractId(serviceRequest);
        if (requestId == null) {
            return List.of();
        }
        return mongoTemplate.find(Query.query(Criteria.where("serviceRequest.$id").is(requestId)), Attachment.class);
    }

    @Override
    public Optional<Attachment> findByIdAndServiceRequest(Long id, ServiceRequest serviceRequest) {
        Long requestId = extractId(serviceRequest);
        if (requestId == null) {
            return Optional.empty();
        }
        Criteria criteria = Criteria.where("_id").is(id).and("serviceRequest.$id").is(requestId);
        return Optional.ofNullable(mongoTemplate.findOne(Query.query(criteria), Attachment.class));
    }

    @Override
    public boolean existsByServiceRequestAndAttachmentType(ServiceRequest serviceRequest, String attachmentType) {
        Long requestId = extractId(serviceRequest);
        if (requestId == null) {
            return false;
        }
        Criteria criteria = Criteria.where("serviceRequest.$id").is(requestId).and("attachmentType").is(attachmentType);
        return mongoTemplate.exists(Query.query(criteria), Attachment.class);
    }

    @Override
    public long countByServiceRequestAndAttachmentTypeStartingWith(ServiceRequest serviceRequest, String prefix) {
        Long requestId = extractId(serviceRequest);
        if (requestId == null) {
            return 0L;
        }
        String pattern = "^" + Pattern.quote(prefix);
        Criteria criteria = Criteria.where("serviceRequest.$id").is(requestId).and("attachmentType").regex(pattern);
        return mongoTemplate.count(Query.query(criteria), Attachment.class);
    }

    @Override
    public void delete(Attachment attachment) {
        mongoTemplate.remove(attachment);
    }
}