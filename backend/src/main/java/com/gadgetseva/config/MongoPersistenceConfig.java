package com.gadgetseva.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@Configuration
@EnableMongoAuditing
@ConditionalOnProperty(name = "app.persistence.type", havingValue = "mongo")
public class MongoPersistenceConfig {
}