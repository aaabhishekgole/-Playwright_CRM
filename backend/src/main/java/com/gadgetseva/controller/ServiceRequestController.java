package com.gadgetseva.controller;

import com.gadgetseva.dto.AssignDeliveryRequest;
import com.gadgetseva.dto.AssignPickupRequest;
import com.gadgetseva.dto.CreateEstimateRequest;
import com.gadgetseva.dto.CreateInvoiceRequest;
import com.gadgetseva.dto.CreateServiceRequestRequest;
import com.gadgetseva.dto.EstimateApprovalRequest;
import com.gadgetseva.dto.ReconcilePaymentRequest;
import com.gadgetseva.dto.RecordPaymentRequest;
import com.gadgetseva.dto.RefundPaymentRequest;
import com.gadgetseva.dto.ServiceRequestResponse;
import com.gadgetseva.dto.StatusTransitionRequest;
import com.gadgetseva.entity.RequestStatus;
import com.gadgetseva.service.ServiceRequestService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/service-requests")
public class ServiceRequestController {

    private final ServiceRequestService serviceRequestService;

    public ServiceRequestController(ServiceRequestService serviceRequestService) {
        this.serviceRequestService = serviceRequestService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM')")
    public ResponseEntity<ServiceRequestResponse> create(@Valid @RequestBody CreateServiceRequestRequest request) {
        return ResponseEntity.ok(serviceRequestService.create(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','TECHNICIAN','PICKUP_AGENT','DELIVERY_AGENT','FINANCE','MSE_TEAM')")
    public ResponseEntity<List<ServiceRequestResponse>> list(@RequestParam(required = false) RequestStatus status) {
        return ResponseEntity.ok(serviceRequestService.list(status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','TECHNICIAN','PICKUP_AGENT','DELIVERY_AGENT','FINANCE','MSE_TEAM')")
    public ResponseEntity<ServiceRequestResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(serviceRequestService.get(id));
    }

    @PostMapping("/{id}/pickup")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM')")
    public ResponseEntity<ServiceRequestResponse> assignPickup(@PathVariable Long id, @Valid @RequestBody AssignPickupRequest request) {
        return ResponseEntity.ok(serviceRequestService.assignPickup(id, request));
    }

    @PostMapping("/{id}/estimate")
    @PreAuthorize("hasAnyRole('ADMIN','BACKEND_TEAM','TECHNICIAN','FINANCE','MSE_TEAM')")
    public ResponseEntity<ServiceRequestResponse> createEstimate(@PathVariable Long id, @Valid @RequestBody CreateEstimateRequest request) {
        return ResponseEntity.ok(serviceRequestService.createEstimate(id, request));
    }

    @PostMapping("/{id}/estimate/approve")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','FINANCE','MSE_TEAM')")
    public ResponseEntity<ServiceRequestResponse> approveEstimate(@PathVariable Long id, @RequestBody(required = false) EstimateApprovalRequest request) {
        String remarks = request != null ? request.remarks() : null;
        return ResponseEntity.ok(serviceRequestService.approveEstimate(id, remarks));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','TECHNICIAN','PICKUP_AGENT','DELIVERY_AGENT','FINANCE','MSE_TEAM')")
    public ResponseEntity<ServiceRequestResponse> transitionStatus(@PathVariable Long id, @Valid @RequestBody StatusTransitionRequest request) {
        return ResponseEntity.ok(serviceRequestService.transitionStatus(id, request));
    }

    @PostMapping("/{id}/delivery")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM')")
    public ResponseEntity<ServiceRequestResponse> assignDelivery(@PathVariable Long id, @Valid @RequestBody AssignDeliveryRequest request) {
        return ResponseEntity.ok(serviceRequestService.assignDelivery(id, request));
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','TECHNICIAN','PICKUP_AGENT','DELIVERY_AGENT','MSE_TEAM')")
    public ResponseEntity<ServiceRequestResponse> uploadAttachment(@PathVariable Long id,
                                                                   @RequestParam String attachmentType,
                                                                   @RequestPart MultipartFile file) {
        return ResponseEntity.ok(serviceRequestService.uploadAttachment(id, attachmentType, file));
    }

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','TECHNICIAN','PICKUP_AGENT','DELIVERY_AGENT','MSE_TEAM')")
    public ResponseEntity<ServiceRequestResponse> deleteAttachment(@PathVariable Long id, @PathVariable Long attachmentId) {
        return ResponseEntity.ok(serviceRequestService.deleteAttachment(id, attachmentId));
    }

    @PostMapping("/{id}/invoice")
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE','MSE_TEAM')")
    public ResponseEntity<ServiceRequestResponse> createInvoice(@PathVariable Long id, @Valid @RequestBody CreateInvoiceRequest request) {
        return ResponseEntity.ok(serviceRequestService.createInvoice(id, request));
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE','MSE_TEAM')")
    public ResponseEntity<ServiceRequestResponse> recordPayment(@PathVariable Long id, @Valid @RequestBody RecordPaymentRequest request) {
        return ResponseEntity.ok(serviceRequestService.recordPayment(id, request));
    }

    @PostMapping("/{id}/payments/{paymentId}/reconcile")
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE','MSE_TEAM')")
    public ResponseEntity<ServiceRequestResponse> reconcilePayment(@PathVariable Long id,
                                                                   @PathVariable Long paymentId,
                                                                   @Valid @RequestBody ReconcilePaymentRequest request) {
        return ResponseEntity.ok(serviceRequestService.reconcilePayment(id, paymentId, request));
    }

    @PostMapping("/{id}/refunds")
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE','MSE_TEAM')")
    public ResponseEntity<ServiceRequestResponse> refundPayment(@PathVariable Long id, @Valid @RequestBody RefundPaymentRequest request) {
        return ResponseEntity.ok(serviceRequestService.refundPayment(id, request));
    }
}
