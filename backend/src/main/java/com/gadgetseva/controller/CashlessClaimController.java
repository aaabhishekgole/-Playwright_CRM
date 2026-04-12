package com.gadgetseva.controller;

import com.gadgetseva.dto.*;
import com.gadgetseva.service.CashlessClaimService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
public class CashlessClaimController {

    private final CashlessClaimService claimService;

    /** Create a new cashless claim linked to a service request */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','MSE_TEAM')")
    public ResponseEntity<ClaimResponse> createClaim(@Valid @RequestBody CreateClaimRequest request) {
        return ResponseEntity.ok(claimService.createClaim(request));
    }

    /** List claims, optionally filtered by status */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','FINANCE','MSE_TEAM')")
    public ResponseEntity<List<ClaimResponse>> listClaims(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(claimService.listClaims(status));
    }

    /** Get a single claim by claim ID */
    @GetMapping("/{claimId}")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','FINANCE','MSE_TEAM')")
    public ResponseEntity<ClaimResponse> getClaim(@PathVariable Long claimId) {
        return ResponseEntity.ok(claimService.getClaim(claimId));
    }

    /** Get claim by service request ID */
    @GetMapping("/by-request/{serviceRequestId}")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','FINANCE','MSE_TEAM')")
    public ResponseEntity<ClaimResponse> getClaimByServiceRequest(@PathVariable Long serviceRequestId) {
        return ResponseEntity.ok(claimService.getClaimByServiceRequest(serviceRequestId));
    }

    /** Upload a claim document (photo, invoice, proof) */
    @PostMapping("/{claimId}/documents")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','MSE_TEAM')")
    public ResponseEntity<ClaimResponse> uploadDocument(
            @PathVariable Long claimId,
            @RequestParam String documentType,
            @RequestParam MultipartFile file) {
        return ResponseEntity.ok(claimService.uploadDocument(claimId, documentType, file));
    }

    /** Move claim to Approval Pending (backend team reviews) */
    @PostMapping("/{claimId}/submit-for-approval")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','MSE_TEAM')")
    public ResponseEntity<ClaimResponse> submitForApproval(@PathVariable Long claimId) {
        return ResponseEntity.ok(claimService.moveToApprovalPending(claimId));
    }

    /** Approve claim with approved amount */
    @PostMapping("/{claimId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','BACKEND_TEAM')")
    public ResponseEntity<ClaimResponse> approveClaim(
            @PathVariable Long claimId,
            @RequestBody ClaimActionRequest request) {
        return ResponseEntity.ok(claimService.approveClaim(claimId, request));
    }

    /** Reject claim with reason */
    @PostMapping("/{claimId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','BACKEND_TEAM')")
    public ResponseEntity<ClaimResponse> rejectClaim(
            @PathVariable Long claimId,
            @RequestBody ClaimActionRequest request) {
        return ResponseEntity.ok(claimService.rejectClaim(claimId, request));
    }

    /** Submit invoice for verification after repair */
    @PostMapping("/{claimId}/submit-invoice")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','MSE_TEAM')")
    public ResponseEntity<ClaimResponse> submitInvoice(
            @PathVariable Long claimId,
            @Valid @RequestBody SubmitInvoiceRequest request) {
        return ResponseEntity.ok(claimService.submitInvoice(claimId, request));
    }

    /** Approve the repair invoice */
    @PostMapping("/{claimId}/approve-invoice")
    @PreAuthorize("hasAnyRole('ADMIN','BACKEND_TEAM')")
    public ResponseEntity<ClaimResponse> approveInvoice(
            @PathVariable Long claimId,
            @RequestBody ClaimActionRequest request) {
        return ResponseEntity.ok(claimService.approveInvoice(claimId, request));
    }

    /** Reject the repair invoice */
    @PostMapping("/{claimId}/reject-invoice")
    @PreAuthorize("hasAnyRole('ADMIN','BACKEND_TEAM')")
    public ResponseEntity<ClaimResponse> rejectInvoice(
            @PathVariable Long claimId,
            @RequestBody ClaimActionRequest request) {
        return ResponseEntity.ok(claimService.rejectInvoice(claimId, request));
    }

    /** Submit final documents to insurance company */
    @PostMapping("/{claimId}/submit-to-insurance")
    @PreAuthorize("hasAnyRole('ADMIN','BACKEND_TEAM','MSE_TEAM')")
    public ResponseEntity<ClaimResponse> submitToInsurance(
            @PathVariable Long claimId,
            @RequestBody InsuranceSubmissionRequest request) {
        return ResponseEntity.ok(claimService.submitToInsurance(claimId, request));
    }

    /** Close the claim after device delivery */
    @PostMapping("/{claimId}/close")
    @PreAuthorize("hasAnyRole('ADMIN','BACKEND_TEAM','CUSTOMER_SUPPORT')")
    public ResponseEntity<ClaimResponse> closeClaim(
            @PathVariable Long claimId,
            @RequestBody ClaimActionRequest request) {
        return ResponseEntity.ok(claimService.closeClaim(claimId, request));
    }
}
