package com.gadgetseva.controller;

import com.gadgetseva.dto.MobileRunnerNotificationResponse;
import com.gadgetseva.entity.Device;
import com.gadgetseva.entity.NotificationLog;
import com.gadgetseva.entity.Pickup;
import com.gadgetseva.entity.RoleName;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.repository.NotificationLogRepository;
import com.gadgetseva.repository.PickupRepository;
import com.gadgetseva.repository.ServiceRequestRepository;
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

    private final NotificationLogRepository notificationLogRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final PickupRepository pickupRepository;

    public MobileRunnerController(NotificationLogRepository notificationLogRepository,
                                  ServiceRequestRepository serviceRequestRepository,
                                  PickupRepository pickupRepository) {
        this.notificationLogRepository = notificationLogRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.pickupRepository = pickupRepository;
    }

    @GetMapping("/notifications")
    @Transactional(readOnly = true)
    public List<MobileRunnerNotificationResponse> listNotifications(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null || user.getUser().getRole() == null || user.getUser().getRole().getName() != RoleName.PICKUP_AGENT) {
            throw new AccessDeniedException("Only pickup riders can open the runner mobile inbox.");
        }
        return notificationLogRepository.findTop50ByChannelAndRecipientOrderByCreatedAtDesc("APP", user.getUsername())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private MobileRunnerNotificationResponse toResponse(NotificationLog notificationLog) {
        ServiceRequest serviceRequest = notificationLog.getServiceRequestId() == null
                ? null
                : serviceRequestRepository.findById(notificationLog.getServiceRequestId()).orElse(null);
        Pickup pickup = serviceRequest == null ? null : pickupRepository.findByServiceRequest(serviceRequest).orElse(null);
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
