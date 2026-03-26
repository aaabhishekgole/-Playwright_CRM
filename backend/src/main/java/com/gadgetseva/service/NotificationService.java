package com.gadgetseva.service;

import com.gadgetseva.entity.NotificationLog;
import com.gadgetseva.entity.ServiceRequest;
import java.util.List;

public interface NotificationService {
    void queueStatusUpdate(ServiceRequest serviceRequest, String subject, String message);
    void queueAlert(ServiceRequest serviceRequest, String recipient, String subject, String message);
    List<NotificationLog> listForRequest(Long serviceRequestId);
}