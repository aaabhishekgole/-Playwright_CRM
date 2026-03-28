package com.gadgetseva.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(NotificationProperties.class)
public class NotificationConfig {

    @Bean
    public RestClient notificationRestClient(RestClient.Builder builder, NotificationProperties notificationProperties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        int timeoutMillis = (int) notificationProperties.getTimeout().toMillis();
        requestFactory.setConnectTimeout(timeoutMillis);
        requestFactory.setReadTimeout(timeoutMillis);
        return builder
                .requestFactory(requestFactory)
                .build();
    }
}
