package com.gadgetseva.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
@ConditionalOnProperty(name = "app.persistence.type", havingValue = "jpa", matchIfMissing = true)
public class JpaPersistenceConfig {
}