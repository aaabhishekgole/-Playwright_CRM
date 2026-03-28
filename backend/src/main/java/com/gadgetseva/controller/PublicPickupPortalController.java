package com.gadgetseva.controller;

import com.gadgetseva.dto.ServiceRequestResponse;
import com.gadgetseva.service.ServiceRequestService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/public/pickups")
public class PublicPickupPortalController {

    private final ServiceRequestService serviceRequestService;

    public PublicPickupPortalController(ServiceRequestService serviceRequestService) {
        this.serviceRequestService = serviceRequestService;
    }

    @GetMapping("/{token}")
    public ResponseEntity<ServiceRequestResponse> getPickupPortal(@PathVariable String token) {
        return ResponseEntity.ok(serviceRequestService.getByPickupToken(token));
    }

    @PostMapping("/{token}/accept")
    public ResponseEntity<ServiceRequestResponse> acceptPickup(@PathVariable String token) {
        return ResponseEntity.ok(serviceRequestService.acceptPickupByToken(token));
    }

    @PostMapping(value = "/{token}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ServiceRequestResponse> uploadPickupAttachment(@PathVariable String token,
                                                                         @RequestParam String attachmentType,
                                                                         @RequestPart MultipartFile file) {
        return ResponseEntity.ok(serviceRequestService.uploadPickupAttachmentByToken(token, attachmentType, file));
    }

    @DeleteMapping("/{token}/attachments/{attachmentId}")
    public ResponseEntity<ServiceRequestResponse> deletePickupAttachment(@PathVariable String token, @PathVariable Long attachmentId) {
        return ResponseEntity.ok(serviceRequestService.deletePickupAttachmentByToken(token, attachmentId));
    }

    @PostMapping("/{token}/complete")
    public ResponseEntity<ServiceRequestResponse> completePickup(@PathVariable String token) {
        return ResponseEntity.ok(serviceRequestService.completePickupByToken(token));
    }
}
