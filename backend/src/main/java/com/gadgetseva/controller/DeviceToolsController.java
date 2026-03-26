package com.gadgetseva.controller;

import com.gadgetseva.dto.DeviceScanRequest;
import com.gadgetseva.dto.DeviceScanResponse;
import com.gadgetseva.service.ServiceRequestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/devices")
public class DeviceToolsController {

    private final ServiceRequestService serviceRequestService;

    public DeviceToolsController(ServiceRequestService serviceRequestService) {
        this.serviceRequestService = serviceRequestService;
    }

    @PostMapping("/scan-qr")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','PICKUP_AGENT','TECHNICIAN')")
    public ResponseEntity<DeviceScanResponse> scanQr(@Valid @RequestBody DeviceScanRequest request) {
        return ResponseEntity.ok(serviceRequestService.scanQr(request));
    }
}