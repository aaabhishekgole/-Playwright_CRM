package com.gadgetseva.persistence.mongo;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "mongo_sequences")
public class MongoSequenceCounter {

    @Id
    private String id;

    private long value;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public long getValue() {
        return value;
    }

    public void setValue(long value) {
        this.value = value;
    }
}