package com.gadgetseva.persistence.mongo;

import com.gadgetseva.entity.Device;
import com.gadgetseva.persistence.DeviceStore;
import com.gadgetseva.persistence.MongoPersistenceAdapter;
import java.util.Optional;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

@MongoPersistenceAdapter
public class MongoDeviceStore extends AbstractMongoStoreSupport implements DeviceStore {

    public MongoDeviceStore(MongoTemplate mongoTemplate, MongoSequenceService mongoSequenceService) {
        super(mongoTemplate, mongoSequenceService);
    }

    @Override
    public Optional<Device> findBySerialNumber(String serialNumber) {
        return Optional.ofNullable(mongoTemplate.findOne(Query.query(Criteria.where("serialNumber").is(serialNumber)), Device.class));
    }

    @Override
    public Device save(Device device) {
        return saveEntity(device, Device.class);
    }
}