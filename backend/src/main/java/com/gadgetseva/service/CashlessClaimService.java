package com.gadgetseva.service;

import com.gadgetseva.dto.*;
import com.gadgetseva.entity.*;
import com.gadgetseva.exception.ApiException;
import com.gadgetseva.exception.NotFoundException;
import com.gadgetseva.persistence.ServiceRequestStore;
import com.gadgetseva.persistence.mongo.MongoSequenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CashlessClaimService {

    private static final BigDecimal EXCESS_THRESHOLD_PERCENT = new BigDecimal("0.10");

    private final MongoTemplate mongoTemplate;
    private final MongoSequenceService mongoSequenceService;
    private final ServiceRequestStore serviceRequestStore;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    // ─── Create Claim ─────────────────────────────────────────────────────────

    public ClaimResponse createClaim(CreateClaimRequest request) {
        ServiceRequest sr = serviceRequestStore.findById(request.getServiceRequestId())
                .orElseThrow(() -> new NotFoundException("Service request not found: " + request.getServiceRequestId()));

        Query existingQuery = Query.query(Criteria.where("serviceRequestId").is(sr.getId()));
        if (mongoTemplate.exists(existingQuery, Claim.class)) {
            throw new ApiException("A claim already exists for service request " + sr.getRequestNumber());
        }

        Claim claim = new Claim();
        claim.setId(mongoSequenceService.nextId("claims"));
        claim.setServiceRequestId(sr.getId());
        claim.setClaimNumber(generateClaimNumber());
        claim.setClaimStatus(ClaimStatus.CLAIM_SUBMITTED);
        claim.setImeiNumber(request.getImeiNumber());
        claim.setSerialNumber(request.getSerialNumber());
        claim.setSubmittedAt(Instant.now());

        // Mark service request as CASHLESS_CLAIM type
        sr.setRequestType(RequestType.CASHLESS_CLAIM);
        serviceRequestStore.save(sr);

        mongoTemplate.save(claim);

        logAction(claim, "CLAIM_SUBMITTED", currentUser(), "Cashless claim submitted", null, null);
        queueNotification(sr, "CLAIM_SUBMITTED", "Your claim " + claim.getClaimNumber() + " has been submitted successfully.");

        log.info("Cashless claim created: {} for service request {}", claim.getClaimNumber(), sr.getRequestNumber());
        return toResponse(claim);
    }

    // ─── List Claims ──────────────────────────────────────────────────────────

    public List<ClaimResponse> listClaims(String status) {
        List<Claim> claims;
        if (status != null && !status.isBlank()) {
            ClaimStatus claimStatus = ClaimStatus.valueOf(status);
            Query q = Query.query(Criteria.where("claimStatus").is(claimStatus.name()))
                    .with(Sort.by(Sort.Direction.DESC, "submittedAt"));
            claims = mongoTemplate.find(q, Claim.class);
        } else {
            Query q = new Query().with(Sort.by(Sort.Direction.DESC, "submittedAt"));
            claims = mongoTemplate.find(q, Claim.class);
        }
        return claims.stream().map(this::toResponse).toList();
    }

    // ─── Get Claim ────────────────────────────────────────────────────────────

    public ClaimResponse getClaim(Long claimId) {
        return toResponse(findClaim(claimId));
    }

    public ClaimResponse getClaimByServiceRequest(Long serviceRequestId) {
        Claim claim = findByServiceRequestId(serviceRequestId)
                .orElseThrow(() -> new NotFoundException("No claim found for service request: " + serviceRequestId));
        return toResponse(claim);
    }

    // ─── Upload Document ──────────────────────────────────────────────────────

    public ClaimResponse uploadDocument(Long claimId, String documentType, MultipartFile file) {
        Claim claim = findClaim(claimId);
        validateDocumentType(documentType);
        validateFile(file);

        // Archive previous current version for this documentType
        Query existingQuery = Query.query(
                Criteria.where("claimId").is(claimId)
                        .and("isCurrent").is(true)
                        .and("documentType").is(documentType));
        List<ClaimDocument> existing = mongoTemplate.find(existingQuery, ClaimDocument.class);
        int nextVersion = 1;
        for (ClaimDocument doc : existing) {
            doc.setCurrent(false);
            mongoTemplate.save(doc);
            nextVersion = doc.getVersionNumber() + 1;
        }

        StoredFileDescriptor stored = fileStorageService.storeInFolder("claims/" + claimId + "/" + documentType, file);

        ClaimDocument doc = new ClaimDocument();
        doc.setId(mongoSequenceService.nextId("claim_documents"));
        doc.setClaimId(claimId);
        doc.setDocumentType(documentType);
        doc.setFileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload");
        doc.setContentType(file.getContentType());
        doc.setObjectKey(stored.objectKey());
        doc.setChecksum(stored.checksum());
        doc.setFileSizeBytes(file.getSize());
        doc.setVersionNumber(nextVersion);
        doc.setCurrent(true);
        doc.setUploadedBy(currentUser());
        doc.setUploadedAt(Instant.now());
        mongoTemplate.save(doc);

        log.info("Claim document uploaded: type={} version={} for claim {}", documentType, nextVersion, claim.getClaimNumber());
        return toResponse(claim);
    }

    // ─── Move to Approval Pending ─────────────────────────────────────────────

    public ClaimResponse moveToApprovalPending(Long claimId) {
        Claim claim = findClaim(claimId);
        assertStatus(claim, ClaimStatus.CLAIM_SUBMITTED, ClaimStatus.REUPLOAD_PENDING);
        claim.setClaimStatus(ClaimStatus.APPROVAL_PENDING);
        mongoTemplate.save(claim);
        logAction(claim, "MOVED_TO_APPROVAL", currentUser(), "Claim moved to approval review", null, null);
        serviceRequestStore.findById(claim.getServiceRequestId()).ifPresent(sr ->
                queueNotification(sr, "APPROVAL_PENDING", "Your claim " + claim.getClaimNumber() + " is under review."));
        return toResponse(claim);
    }

    // ─── Approve Claim ────────────────────────────────────────────────────────

    public ClaimResponse approveClaim(Long claimId, ClaimActionRequest request) {
        Claim claim = findClaim(claimId);
        assertStatus(claim, ClaimStatus.APPROVAL_PENDING);

        if (request.getApprovedAmount() == null || request.getApprovedAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException("Approved amount is required and must be greater than zero");
        }

        claim.setClaimStatus(ClaimStatus.APPROVED);
        claim.setApprovedAmount(request.getApprovedAmount());
        claim.setApprovedAt(Instant.now());

        if (Boolean.TRUE.equals(request.getImeiVerified())) {
            claim.setImeiVerified(true);
            claim.setImeiVerifiedAt(Instant.now());
            claim.setImeiVerifiedBy(currentUser());
        }
        if (request.getImeiVerificationNote() != null) {
            claim.setImeiVerificationNote(request.getImeiVerificationNote());
        }

        mongoTemplate.save(claim);
        logAction(claim, "CLAIM_APPROVED", currentUser(), request.getRemarks(), request.getApprovedAmount(), null);
        serviceRequestStore.findById(claim.getServiceRequestId()).ifPresent(sr ->
                queueNotification(sr, "CLAIM_APPROVED",
                        "Your claim " + claim.getClaimNumber() + " has been approved for ₹" + request.getApprovedAmount() + ". Pickup will be arranged shortly."));
        return toResponse(claim);
    }

    // ─── Reject Claim ─────────────────────────────────────────────────────────

    public ClaimResponse rejectClaim(Long claimId, ClaimActionRequest request) {
        Claim claim = findClaim(claimId);
        assertStatus(claim, ClaimStatus.APPROVAL_PENDING);

        if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
            throw new ApiException("Rejection reason is required");
        }

        int attempts = claim.getReuploadAttemptCount() + 1;
        claim.setReuploadAttemptCount(attempts);

        if (attempts >= claim.getMaxReuploadAttempts()) {
            claim.setLockedForAdmin(true);
            claim.setClaimStatus(ClaimStatus.REJECTED);
            claim.setRejectionReason(request.getRejectionReason());
            claim.setRejectedAt(Instant.now());
            logAction(claim, "CLAIM_LOCKED", currentUser(), "Max re-upload attempts reached. Claim locked for admin review.", null, request.getRejectionReason());
        } else {
            claim.setClaimStatus(ClaimStatus.REUPLOAD_PENDING);
            claim.setRejectionReason(request.getRejectionReason());
            logAction(claim, "CLAIM_REJECTED", currentUser(), request.getRemarks(), null, request.getRejectionReason());
            serviceRequestStore.findById(claim.getServiceRequestId()).ifPresent(sr ->
                    queueNotification(sr, "CLAIM_REJECTED",
                            "Claim " + claim.getClaimNumber() + " rejected: " + request.getRejectionReason() + ". Please re-upload correct documents."));
        }

        mongoTemplate.save(claim);
        return toResponse(claim);
    }

    // ─── Submit Invoice ────────────────────────────────────────────────────────

    public ClaimResponse submitInvoice(Long claimId, SubmitInvoiceRequest request) {
        Claim claim = findClaim(claimId);
        assertStatus(claim, ClaimStatus.APPROVED);

        if (request.isExcessPaymentMade()) {
            Query proofQuery = Query.query(
                    Criteria.where("claimId").is(claimId)
                            .and("documentType").is("EXCESS_PAYMENT_PROOF")
                            .and("isCurrent").is(true));
            if (!mongoTemplate.exists(proofQuery, ClaimDocument.class)) {
                throw new ApiException("Excess payment proof document must be uploaded before submitting invoice");
            }
        }

        Query invQuery = Query.query(Criteria.where("claimId").is(claimId));
        InvoiceVerification inv = mongoTemplate.findOne(invQuery, InvoiceVerification.class);
        if (inv == null) {
            inv = new InvoiceVerification();
            inv.setId(mongoSequenceService.nextId("invoice_verification"));
            inv.setClaimId(claimId);
        }
        inv.setInvoiceAmount(request.getInvoiceAmount());
        inv.setApprovedAmount(claim.getApprovedAmount());
        inv.setInvoiceStatus("INVOICE_SUBMITTED");
        inv.setSubmittedAt(Instant.now());

        BigDecimal excess = request.getInvoiceAmount().subtract(claim.getApprovedAmount() != null ? claim.getApprovedAmount() : BigDecimal.ZERO);
        inv.setExcessAmount(excess.compareTo(BigDecimal.ZERO) > 0 ? excess : BigDecimal.ZERO);
        inv.setExcessProofUploaded(request.isExcessPaymentMade());

        if (claim.getApprovedAmount() != null && excess.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal threshold = claim.getApprovedAmount().multiply(EXCESS_THRESHOLD_PERCENT);
            inv.setApprovalThresholdBreached(excess.compareTo(threshold) > 0);
            inv.setAdminApprovalRequired(excess.compareTo(threshold) > 0);
        }

        mongoTemplate.save(inv);

        claim.setClaimStatus(ClaimStatus.INVOICE_SUBMITTED);
        mongoTemplate.save(claim);

        logAction(claim, "INVOICE_SUBMITTED", currentUser(), "Invoice submitted for verification", null, null);
        serviceRequestStore.findById(claim.getServiceRequestId()).ifPresent(sr ->
                queueNotification(sr, "INVOICE_SUBMITTED",
                        "Invoice for claim " + claim.getClaimNumber() + " has been submitted for approval."));
        return toResponse(claim);
    }

    // ─── Approve Invoice ───────────────────────────────────────────────────────

    public ClaimResponse approveInvoice(Long claimId, ClaimActionRequest request) {
        Claim claim = findClaim(claimId);
        assertStatus(claim, ClaimStatus.INVOICE_SUBMITTED);

        Query invQuery = Query.query(Criteria.where("claimId").is(claimId));
        InvoiceVerification inv = mongoTemplate.findOne(invQuery, InvoiceVerification.class);
        if (inv == null) throw new NotFoundException("Invoice verification record not found for claim: " + claimId);

        inv.setInvoiceStatus("INVOICE_APPROVED");
        inv.setApprovedAt(Instant.now());
        mongoTemplate.save(inv);

        // Upsert insurance submission record
        Query subQuery = Query.query(Criteria.where("claimId").is(claimId));
        InsuranceSubmission sub = mongoTemplate.findOne(subQuery, InsuranceSubmission.class);
        if (sub == null) {
            sub = new InsuranceSubmission();
            sub.setId(mongoSequenceService.nextId("insurance_submissions"));
            sub.setClaimId(claimId);
        }
        sub.setSubStatus("READY_FOR_INSURANCE");
        mongoTemplate.save(sub);

        claim.setClaimStatus(ClaimStatus.READY_FOR_INSURANCE);
        mongoTemplate.save(claim);

        logAction(claim, "INVOICE_APPROVED", currentUser(), request.getRemarks(), null, null);
        serviceRequestStore.findById(claim.getServiceRequestId()).ifPresent(sr ->
                queueNotification(sr, "INVOICE_APPROVED",
                        "Invoice for claim " + claim.getClaimNumber() + " has been approved. Proceeding to insurance submission."));
        return toResponse(claim);
    }

    // ─── Reject Invoice ────────────────────────────────────────────────────────

    public ClaimResponse rejectInvoice(Long claimId, ClaimActionRequest request) {
        Claim claim = findClaim(claimId);
        assertStatus(claim, ClaimStatus.INVOICE_SUBMITTED);

        if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
            throw new ApiException("Rejection reason is required");
        }

        Query invQuery = Query.query(Criteria.where("claimId").is(claimId));
        InvoiceVerification inv = mongoTemplate.findOne(invQuery, InvoiceVerification.class);
        if (inv == null) throw new NotFoundException("Invoice verification record not found for claim: " + claimId);

        int attempts = inv.getReuploadAttemptCount() + 1;
        inv.setReuploadAttemptCount(attempts);
        inv.setRejectionReason(request.getRejectionReason());
        inv.setInvoiceStatus("INVOICE_REJECTED");
        inv.setRejectedAt(Instant.now());
        mongoTemplate.save(inv);

        claim.setClaimStatus(ClaimStatus.INVOICE_REUPLOAD_PENDING);
        mongoTemplate.save(claim);

        logAction(claim, "INVOICE_REJECTED", currentUser(), request.getRemarks(), null, request.getRejectionReason());
        serviceRequestStore.findById(claim.getServiceRequestId()).ifPresent(sr ->
                queueNotification(sr, "INVOICE_REJECTED",
                        "Invoice for claim " + claim.getClaimNumber() + " was rejected: " + request.getRejectionReason() + ". Please re-upload."));
        return toResponse(claim);
    }

    // ─── Submit to Insurance ──────────────────────────────────────────────────

    public ClaimResponse submitToInsurance(Long claimId, InsuranceSubmissionRequest request) {
        Claim claim = findClaim(claimId);
        assertStatus(claim, ClaimStatus.READY_FOR_INSURANCE);

        Query subQuery = Query.query(Criteria.where("claimId").is(claimId));
        InsuranceSubmission sub = mongoTemplate.findOne(subQuery, InsuranceSubmission.class);
        if (sub == null) throw new NotFoundException("Insurance submission record not found for claim: " + claimId);

        sub.setSubStatus("SUBMITTED_TO_INSURANCE");
        sub.setSubmittedBy(currentUser());
        sub.setSubmittedAt(Instant.now());
        sub.setNotes(request.getNotes());
        mongoTemplate.save(sub);

        claim.setClaimStatus(ClaimStatus.SUBMITTED_TO_INSURANCE);
        mongoTemplate.save(claim);

        logAction(claim, "SUBMITTED_TO_INSURANCE", currentUser(), request.getNotes(), null, null);
        serviceRequestStore.findById(claim.getServiceRequestId()).ifPresent(sr ->
                queueNotification(sr, "SUBMITTED_TO_INSURANCE",
                        "Claim " + claim.getClaimNumber() + " documents have been submitted to the insurance company."));
        return toResponse(claim);
    }

    // ─── Close Claim ──────────────────────────────────────────────────────────

    public ClaimResponse closeClaim(Long claimId, ClaimActionRequest request) {
        Claim claim = findClaim(claimId);
        assertStatus(claim, ClaimStatus.SUBMITTED_TO_INSURANCE);

        claim.setClaimStatus(ClaimStatus.CLOSED);
        claim.setClosedAt(Instant.now());
        mongoTemplate.save(claim);

        logAction(claim, "CLAIM_CLOSED", currentUser(), request.getRemarks(), null, null);
        serviceRequestStore.findById(claim.getServiceRequestId()).ifPresent(sr ->
                queueNotification(sr, "CLAIM_CLOSED",
                        "Your claim " + claim.getClaimNumber() + " has been successfully completed. Thank you!"));
        return toResponse(claim);
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    private Claim findClaim(Long claimId) {
        Claim claim = mongoTemplate.findById(claimId, Claim.class);
        if (claim == null) throw new NotFoundException("Claim not found: " + claimId);
        return claim;
    }

    private Optional<Claim> findByServiceRequestId(Long serviceRequestId) {
        Query q = Query.query(Criteria.where("serviceRequestId").is(serviceRequestId));
        return Optional.ofNullable(mongoTemplate.findOne(q, Claim.class));
    }

    private void assertStatus(Claim claim, ClaimStatus... allowed) {
        for (ClaimStatus s : allowed) {
            if (claim.getClaimStatus() == s) return;
        }
        throw new ApiException("Invalid operation for claim in status: " + claim.getClaimStatus());
    }

    private void logAction(Claim claim, String action, String actor, String remarks, BigDecimal amount, String rejectionReason) {
        ClaimApprovalLog entry = new ClaimApprovalLog();
        entry.setId(mongoSequenceService.nextId("claim_approval_logs"));
        entry.setClaimId(claim.getId());
        entry.setAction(action);
        entry.setActionBy(actor);
        entry.setActionAt(Instant.now());
        entry.setRemarks(remarks);
        entry.setApprovedAmount(amount);
        entry.setRejectionReason(rejectionReason);
        mongoTemplate.save(entry);
    }

    private void queueNotification(ServiceRequest sr, String event, String message) {
        try {
            notificationService.queueStatusUpdate(sr, event, message);
        } catch (Exception ex) {
            log.warn("Failed to queue notification for claim event {}: {}", event, ex.getMessage());
        }
    }

    private String currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    private String generateClaimNumber() {
        return "CLM-" + String.format("%08d", mongoSequenceService.nextId("claim_numbers"));
    }

    private void validateDocumentType(String documentType) {
        List<String> allowed = List.of(
                "CLAIM_DEVICE_PHOTO_1", "CLAIM_DEVICE_PHOTO_2", "CLAIM_DEVICE_PHOTO_3",
                "CLAIM_DEVICE_PHOTO_4", "CLAIM_DEVICE_PHOTO_5", "CLAIM_DEVICE_PHOTO_6",
                "PURCHASE_INVOICE", "REPAIR_INVOICE", "EXCESS_PAYMENT_PROOF",
                "INSURANCE_CLAIM_FILE", "INSURANCE_APPROVAL_DOC", "OTHER"
        );
        if (!allowed.contains(documentType)) {
            throw new ApiException("Invalid document type: " + documentType);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("File is required");
        }
        long maxBytes = 10 * 1024 * 1024; // 10 MB
        if (file.getSize() > maxBytes) {
            throw new ApiException("File size exceeds 10 MB limit");
        }
        String ct = file.getContentType();
        if (ct == null || (!ct.startsWith("image/") && !ct.equals("application/pdf")
                && !ct.equals("application/msword")
                && !ct.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))) {
            throw new ApiException("Unsupported file type: " + ct);
        }
    }

    // ─── Response mapper ──────────────────────────────────────────────────────

    private ClaimResponse toResponse(Claim claim) {
        ClaimResponse resp = new ClaimResponse();
        resp.setId(claim.getId());
        resp.setServiceRequestId(claim.getServiceRequestId());
        resp.setClaimNumber(claim.getClaimNumber());
        resp.setClaimStatus(claim.getClaimStatus().name());
        resp.setImeiNumber(claim.getImeiNumber());
        resp.setSerialNumber(claim.getSerialNumber());
        resp.setImeiVerified(claim.isImeiVerified());
        resp.setImeiVerificationNote(claim.getImeiVerificationNote());
        resp.setApprovedAmount(claim.getApprovedAmount());
        resp.setRejectionReason(claim.getRejectionReason());
        resp.setReuploadAttemptCount(claim.getReuploadAttemptCount());
        resp.setMaxReuploadAttempts(claim.getMaxReuploadAttempts());
        resp.setLockedForAdmin(claim.isLockedForAdmin());
        resp.setSubmittedAt(claim.getSubmittedAt());
        resp.setApprovedAt(claim.getApprovedAt());
        resp.setRejectedAt(claim.getRejectedAt());
        resp.setClosedAt(claim.getClosedAt());

        // Enrich from service request (best-effort)
        serviceRequestStore.findById(claim.getServiceRequestId()).ifPresent(sr -> {
            resp.setRequestNumber(sr.getRequestNumber());
            try {
                if (sr.getCustomer() != null) resp.setCustomerName(sr.getCustomer().getFullName());
                if (sr.getDevice() != null)
                    resp.setDeviceLabel(sr.getDevice().getBrand() + " " + sr.getDevice().getModel());
            } catch (Exception ignored) {}
        });

        // Documents (current versions only)
        Query docsQuery = Query.query(
                Criteria.where("claimId").is(claim.getId()).and("isCurrent").is(true));
        resp.setDocuments(mongoTemplate.find(docsQuery, ClaimDocument.class).stream()
                .map(d -> {
                    ClaimDocumentResponse dr = new ClaimDocumentResponse();
                    dr.setId(d.getId());
                    dr.setDocumentType(d.getDocumentType());
                    dr.setFileName(d.getFileName());
                    dr.setContentType(d.getContentType());
                    dr.setObjectKey(d.getObjectKey());
                    dr.setFileSizeBytes(d.getFileSizeBytes());
                    dr.setVersionNumber(d.getVersionNumber());
                    dr.setCurrent(d.isCurrent());
                    dr.setUploadedBy(d.getUploadedBy());
                    dr.setUploadedAt(d.getUploadedAt());
                    return dr;
                }).toList());

        // Approval logs (newest first)
        Query logsQuery = Query.query(Criteria.where("claimId").is(claim.getId()))
                .with(Sort.by(Sort.Direction.DESC, "actionAt"));
        resp.setApprovalLogs(mongoTemplate.find(logsQuery, ClaimApprovalLog.class).stream()
                .map(l -> {
                    ClaimApprovalLogResponse lr = new ClaimApprovalLogResponse();
                    lr.setId(l.getId());
                    lr.setAction(l.getAction());
                    lr.setActionBy(l.getActionBy());
                    lr.setActionAt(l.getActionAt());
                    lr.setRemarks(l.getRemarks());
                    lr.setApprovedAmount(l.getApprovedAmount());
                    lr.setRejectionReason(l.getRejectionReason());
                    return lr;
                }).toList());

        // Invoice verification
        Query invQuery = Query.query(Criteria.where("claimId").is(claim.getId()));
        InvoiceVerification inv = mongoTemplate.findOne(invQuery, InvoiceVerification.class);
        if (inv != null) {
            InvoiceVerificationResponse ivr = new InvoiceVerificationResponse();
            ivr.setId(inv.getId());
            ivr.setInvoiceStatus(inv.getInvoiceStatus());
            ivr.setInvoiceAmount(inv.getInvoiceAmount());
            ivr.setApprovedAmount(inv.getApprovedAmount());
            ivr.setExcessAmount(inv.getExcessAmount());
            ivr.setExcessProofUploaded(inv.isExcessProofUploaded());
            ivr.setApprovalThresholdBreached(inv.isApprovalThresholdBreached());
            ivr.setAdminApprovalRequired(inv.isAdminApprovalRequired());
            ivr.setRejectionReason(inv.getRejectionReason());
            ivr.setReuploadAttemptCount(inv.getReuploadAttemptCount());
            ivr.setSubmittedAt(inv.getSubmittedAt());
            ivr.setApprovedAt(inv.getApprovedAt());
            ivr.setRejectedAt(inv.getRejectedAt());
            resp.setInvoiceVerification(ivr);
        }

        // Insurance submission
        Query subQuery = Query.query(Criteria.where("claimId").is(claim.getId()));
        InsuranceSubmission sub = mongoTemplate.findOne(subQuery, InsuranceSubmission.class);
        if (sub != null) {
            InsuranceSubmissionResponse isr = new InsuranceSubmissionResponse();
            isr.setId(sub.getId());
            isr.setSubStatus(sub.getSubStatus());
            isr.setSubmittedBy(sub.getSubmittedBy());
            isr.setSubmittedAt(sub.getSubmittedAt());
            isr.setNotes(sub.getNotes());
            resp.setInsuranceSubmission(isr);
        }

        return resp;
    }
}
