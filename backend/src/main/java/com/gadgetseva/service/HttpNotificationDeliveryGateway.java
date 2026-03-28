package com.gadgetseva.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gadgetseva.config.NotificationProperties;
import com.gadgetseva.entity.NotificationLog;
import com.gadgetseva.entity.ServiceRequest;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Slf4j
@Component
public class HttpNotificationDeliveryGateway implements NotificationDeliveryGateway {

    private final RestClient restClient;
    private final NotificationProperties notificationProperties;
    private final ObjectMapper objectMapper;

    public HttpNotificationDeliveryGateway(RestClient notificationRestClient,
                                           NotificationProperties notificationProperties,
                                           ObjectMapper objectMapper) {
        this.restClient = notificationRestClient;
        this.notificationProperties = notificationProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    public DeliveryResult deliver(NotificationLog notificationLog, ServiceRequest serviceRequest) {
        NotificationProperties.Channel channelProperties = resolveChannelProperties(notificationLog.getChannel());
        if (channelProperties == null || !channelProperties.isEnabled()) {
            return DeliveryResult.failure("HTTP delivery not configured for channel " + notificationLog.getChannel());
        }
        if (channelProperties.getUrl() == null || channelProperties.getUrl().isBlank()) {
            return DeliveryResult.failure("Gateway URL missing for channel " + notificationLog.getChannel());
        }

        Map<String, Object> body = buildBody(notificationLog, serviceRequest, channelProperties);
        try {
            restClient.post()
                    .uri(channelProperties.getUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(headers -> {
                        if (notificationProperties.getGateway().getApiKey() != null && !notificationProperties.getGateway().getApiKey().isBlank()) {
                            headers.set(notificationProperties.getGateway().getAuthHeader(), notificationProperties.getGateway().getApiKey());
                        }
                        channelProperties.getHeaders().forEach(headers::set);
                    })
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            return DeliveryResult.success();
        } catch (RestClientException exception) {
            log.warn("Notification gateway delivery failed for notification {}", notificationLog.getId(), exception);
            return DeliveryResult.failure(exception.getMessage());
        }
    }

    private NotificationProperties.Channel resolveChannelProperties(String channel) {
        if (channel == null) {
            return null;
        }
        return switch (channel.toUpperCase(Locale.ROOT)) {
            case "SMS" -> notificationProperties.getGateway().getSms();
            case "WHATSAPP" -> notificationProperties.getGateway().getWhatsapp();
            default -> null;
        };
    }

    private Map<String, Object> buildBody(NotificationLog notificationLog,
                                          ServiceRequest serviceRequest,
                                          NotificationProperties.Channel channelProperties) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("channel", notificationLog.getChannel());
        body.put("recipient", normalizeRecipient(notificationLog.getRecipient()));
        body.put("subject", notificationLog.getSubject());
        body.put("message", notificationLog.getMessage());
        body.put("senderId", channelProperties.getSenderId());
        body.put("integratedNumber", channelProperties.getIntegratedNumber());
        body.put("templateName", channelProperties.getTemplateName());
        body.put("serviceRequestId", notificationLog.getServiceRequestId());

        if (serviceRequest != null) {
            body.put("requestNumber", serviceRequest.getRequestNumber());
            body.put("tenantCode", serviceRequest.getTenant() != null ? serviceRequest.getTenant().getCode() : null);
            body.put("customerName", serviceRequest.getCustomer() != null ? serviceRequest.getCustomer().getFullName() : null);
        }

        body.put("meta", extractPayload(notificationLog.getPayloadJson()));
        return body;
    }

    private Object extractPayload(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception exception) {
            return Map.of("rawPayload", payloadJson);
        }
    }

    private String normalizeRecipient(String recipient) {
        if (recipient == null) {
            return null;
        }
        String digitsOnly = recipient.replaceAll("[^0-9]", "");
        if (digitsOnly.length() == 10) {
            return "91" + digitsOnly;
        }
        return digitsOnly.isBlank() ? recipient : digitsOnly;
    }
}
