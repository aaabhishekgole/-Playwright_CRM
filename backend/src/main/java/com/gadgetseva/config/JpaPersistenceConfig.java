package com.gadgetseva.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EntityScan(basePackages = "com.gadgetseva.entity")
@EnableJpaAuditing
@EnableJpaRepositories(basePackages = "com.gadgetseva.repository.jpa")
@ConditionalOnProperty(name = "app.persistence.type", havingValue = "jpa")
public class JpaPersistenceConfig {
}
