package com.gadgetseva.config;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.notifications")
public class NotificationProperties {

    private Provider provider = Provider.LOG;
    private Duration timeout = Duration.ofSeconds(10);
    private final HttpGateway gateway = new HttpGateway();

    public Provider getProvider() {
        return provider;
    }

    public void setProvider(Provider provider) {
        this.provider = provider;
    }

    public Duration getTimeout() {
        return timeout;
    }

    public void setTimeout(Duration timeout) {
        this.timeout = timeout;
    }

    public HttpGateway getGateway() {
        return gateway;
    }

    public enum Provider {
        LOG,
        HTTP
    }

    public static class HttpGateway {
        private String apiKey;
        private String authHeader = "authkey";
        private final Channel sms = new Channel();
        private final Channel whatsapp = new Channel();

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getAuthHeader() {
            return authHeader;
        }

        public void setAuthHeader(String authHeader) {
            this.authHeader = authHeader;
        }

        public Channel getSms() {
            return sms;
        }

        public Channel getWhatsapp() {
            return whatsapp;
        }
    }

    public static class Channel {
        private boolean enabled;
        private String url;
        private String senderId;
        private String integratedNumber;
        private String templateName;
        private final Map<String, String> headers = new LinkedHashMap<>();

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getSenderId() {
            return senderId;
        }

        public void setSenderId(String senderId) {
            this.senderId = senderId;
        }

        public String getIntegratedNumber() {
            return integratedNumber;
        }

        public void setIntegratedNumber(String integratedNumber) {
            this.integratedNumber = integratedNumber;
        }

        public String getTemplateName() {
            return templateName;
        }

        public void setTemplateName(String templateName) {
            this.templateName = templateName;
        }

        public Map<String, String> getHeaders() {
            return headers;
        }
    }
}
