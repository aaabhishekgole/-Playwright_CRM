package com.gadgetseva.controller;

import com.gadgetseva.dto.MobileRunnerNotificationResponse;
import com.gadgetseva.entity.Device;
import com.gadgetseva.entity.NotificationLog;
import com.gadgetseva.entity.Pickup;
import com.gadgetseva.entity.RoleName;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.NotificationLogStore;
import com.gadgetseva.persistence.PickupStore;
import com.gadgetseva.persistence.ServiceRequestStore;
import com.gadgetseva.security.AuthenticatedUser;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mobile/runner")
public class MobileRunnerController {

    private final NotificationLogStore notificationLogStore;
    private final ServiceRequestStore serviceRequestStore;
    private final PickupStore pickupStore;

    public MobileRunnerController(NotificationLogStore notificationLogStore,
                                  ServiceRequestStore serviceRequestStore,
                                  PickupStore pickupStore) {
        this.notificationLogStore = notificationLogStore;
        this.serviceRequestStore = serviceRequestStore;
        this.pickupStore = pickupStore;
    }

    @GetMapping("/notifications")
    @Transactional(readOnly = true)
    public List<MobileRunnerNotificationResponse> listNotifications(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null || user.getUser().getRole() == null || user.getUser().getRole().getName() != RoleName.PICKUP_AGENT) {
            throw new AccessDeniedException("Only pickup riders can open the runner mobile inbox.");
        }
        return notificationLogStore.findTop50ByChannelAndRecipientOrderByCreatedAtDesc("APP", user.getUsername())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private MobileRunnerNotificationResponse toResponse(NotificationLog notificationLog) {
        ServiceRequest serviceRequest = notificationLog.getServiceRequestId() == null
                ? null
                : serviceRequestStore.findById(notificationLog.getServiceRequestId()).orElse(null);
        Pickup pickup = serviceRequest == null ? null : pickupStore.findByServiceRequest(serviceRequest).orElse(null);
        return new MobileRunnerNotificationResponse(
                notificationLog.getId(),
                notificationLog.getChannel(),
                notificationLog.getSubject(),
                notificationLog.getMessage(),
                notificationLog.getDeliveryStatus().name(),
                notificationLog.getCreatedAt(),
                serviceRequest != null ? serviceRequest.getId() : null,
                serviceRequest != null ? serviceRequest.getRequestNumber() : null,
                serviceRequest != null && serviceRequest.getCustomer() != null ? serviceRequest.getCustomer().getFullName() : null,
                serviceRequest != null ? deviceLabel(serviceRequest.getDevice()) : null,
                serviceRequest != null && serviceRequest.getStatus() != null ? serviceRequest.getStatus().name() : null,
                pickup != null ? pickup.getScheduledAt() : null,
                pickup != null ? pickup.getRunnerPortalToken() : null
        );
    }

    private String deviceLabel(Device device) {
        if (device == null) {
            return null;
        }
        String brand = device.getBrand() == null ? "" : device.getBrand().trim();
        String model = device.getModel() == null ? "" : device.getModel().trim();
        String label = (brand + " " + model).trim();
        return label.isBlank() ? device.getSerialNumber() : label;
    }
}
