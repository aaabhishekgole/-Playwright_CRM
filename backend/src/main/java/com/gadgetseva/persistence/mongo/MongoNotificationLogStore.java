package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.NotificationDeliveryStatus;
import com.gadgetseva.entity.NotificationLog;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import com.gadgetseva.persistence.NotificationLogStore;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoNotificationLogStore extends AbstractMongoStoreSupport implements NotificationLogStore {

    public MongoNotificationLogStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public NotificationLog save(NotificationLog notificationLog) {
        return saveEntity(notificationLog, NotificationLog.class);
    }

    @Override
    public List<NotificationLog> findByServiceRequestIdOrderByCreatedAtDesc(Long serviceRequestId) {
        return mongoTemplate.find(Query.query(Criteria.where("serviceRequestId").is(serviceRequestId)).with(Sort.by(Sort.Direction.DESC, "createdAt")), NotificationLog.class);
    }

    @Override
    public List<NotificationLog> findTop50ByChannelAndRecipientOrderByCreatedAtDesc(String channel, String recipient) {
        Query query = Query.query(Criteria.where("channel").is(channel).and("recipient").is(recipient))
                .with(Sort.by(Sort.Direction.DESC, "createdAt"))
                .limit(50);
        return mongoTemplate.find(query, NotificationLog.class);
    }

    @Override
    public List<NotificationLog> findTop20ByDeliveryStatusInAndNextRetryAtBeforeOrderByCreatedAtAsc(Collection<NotificationDeliveryStatus> statuses, Instant nextRetryAt) {
        Criteria criteria = Criteria.where("deliveryStatus").in(statuses).and("nextRetryAt").lt(nextRetryAt);
        Query query = Query.query(criteria).with(Sort.by(Sort.Direction.ASC, "createdAt")).limit(20);
        return mongoTemplate.find(query, NotificationLog.class);
    }
}