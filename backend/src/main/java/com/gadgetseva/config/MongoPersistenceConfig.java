package com.gadgetseva.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableMongoAuditing
@EnableMongoRepositories(basePackages = "com.gadgetseva.repository.mongo")
@ConditionalOnProperty(name = "app.persistence.type", havingValue = "mongo")
public class MongoPersistenceConfig {
}
