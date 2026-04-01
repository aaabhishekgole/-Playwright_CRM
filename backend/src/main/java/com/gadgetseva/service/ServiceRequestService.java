package com.gadgetseva.service;

import com.gadgetseva.dto.AssignDeliveryRequest;
import com.gadgetseva.dto.AssignPickupRequest;
import com.gadgetseva.dto.CreateEstimateRequest;
import com.gadgetseva.dto.CreateInvoiceRequest;
import com.gadgetseva.dto.CreateServiceRequestRequest;
import com.gadgetseva.dto.DeviceScanRequest;
import com.gadgetseva.dto.DeviceScanResponse;
import com.gadgetseva.dto.RecordPaymentRequest;
import com.gadgetseva.dto.RefundPaymentRequest;
import com.gadgetseva.dto.ServiceRequestResponse;
import com.gadgetseva.dto.StatusTransitionRequest;
import com.gadgetseva.entity.Attachment;
import com.gadgetseva.entity.Customer;
import com.gadgetseva.entity.Delivery;
import com.gadgetseva.entity.Device;
import com.gadgetseva.entity.DeviceCategory;
import com.gadgetseva.entity.Estimate;
import com.gadgetseva.entity.GstType;
import com.gadgetseva.entity.ImeiValidationStatus;
import com.gadgetseva.entity.Invoice;
import com.gadgetseva.entity.InvoiceLineItem;
import com.gadgetseva.entity.NotificationLog;
import com.gadgetseva.entity.PaymentStatus;
import com.gadgetseva.entity.PaymentTransaction;
import com.gadgetseva.entity.Pickup;
import com.gadgetseva.entity.RefundStatus;
import com.gadgetseva.entity.RoleName;
import com.gadgetseva.entity.RequestStatus;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.entity.StatusHistory;
import com.gadgetseva.entity.Tenant;
import com.gadgetseva.entity.User;
import com.gadgetseva.exception.ApiException;
import com.gadgetseva.exception.NotFoundException;
import com.gadgetseva.mapper.ServiceRequestMapper;
import com.gadgetseva.persistence.AttachmentStore;
import com.gadgetseva.persistence.CustomerStore;
import com.gadgetseva.persistence.DeliveryStore;
import com.gadgetseva.persistence.DeviceStore;
import com.gadgetseva.persistence.EstimateStore;
import com.gadgetseva.persistence.InvoiceLineItemStore;
import com.gadgetseva.persistence.InvoiceStore;
import com.gadgetseva.persistence.PaymentTransactionStore;
import com.gadgetseva.persistence.PickupStore;
import com.gadgetseva.persistence.ServiceRequestStore;
import com.gadgetseva.persistence.StatusHistoryStore;
import com.gadgetseva.persistence.TenantStore;
import com.gadgetseva.persistence.UserStore;
import com.gadgetseva.security.AuthenticatedUser;
import com.gadgetseva.util.ImeiTools;
import com.gadgetseva.util.RequestNumberGenerator;
import com.gadgetseva.util.StatusTransitionRules;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@Transactional
public class ServiceRequestService {

    private static final int REQUIRED_PICKUP_PHOTO_COUNT = 10;
    private static final int MAX_PICKUP_EXTRA_PHOTO_COUNT = 20;
    private static final List<String> REQUIRED_PICKUP_ATTACHMENT_TYPES = List.of(
            "PICKUP_IMAGE_FRONT",
            "PICKUP_IMAGE_BACK",
            "PICKUP_IMAGE_LEFT",
            "PICKUP_IMAGE_RIGHT",
            "PICKUP_IMAGE_TOP",
            "PICKUP_IMAGE_BOTTOM",
            "PICKUP_IMAGE_DISPLAY_ON",
            "PICKUP_IMAGE_SERIAL_LABEL",
            "PICKUP_IMAGE_DAMAGE_CLOSEUP",
            "PICKUP_IMAGE_ACCESSORIES"
    );
    private static final Set<RequestStatus> RUNNER_PICKUP_ACTIVE_STATUSES = Set.of(
            RequestStatus.PICKUP_ASSIGNED,
            RequestStatus.PICKUP_IN_PROGRESS
    );
    private static final Set<RequestStatus> RUNNER_PICKUP_CUSTOMER_UPDATE_STATUSES = Set.of(
            RequestStatus.CUSTOMER_NOT_AVAILABLE,
            RequestStatus.CUSTOMER_RESCHEDULED,
            RequestStatus.CUSTOMER_NOT_CONTACTABLE
    );

    private final ServiceRequestStore serviceRequestStore;
    private final CustomerStore customerStore;
    private final DeviceStore deviceStore;
    private final UserStore userStore;
    private final PickupStore pickupStore;
    private final EstimateStore estimateStore;
    private final DeliveryStore deliveryStore;
    private final StatusHistoryStore statusHistoryStore;
    private final AttachmentStore attachmentStore;
    private final InvoiceStore invoiceStore;
    private final InvoiceLineItemStore invoiceLineItemStore;
    private final PaymentTransactionStore paymentTransactionStore;
    private final TenantStore tenantStore;
    private final ServiceRequestMapper mapper;
    private final RequestNumberGenerator requestNumberGenerator;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final AuditTrailService auditTrailService;
    private final String repairCenterStateCode;
    private final String runnerPortalBaseUrl;

    public ServiceRequestService(ServiceRequestStore serviceRequestStore,
                                 CustomerStore customerStore,
                                 DeviceStore deviceStore,
                                 UserStore userStore,
                                 PickupStore pickupStore,
                                 EstimateStore estimateStore,
                                 DeliveryStore deliveryStore,
                                 StatusHistoryStore statusHistoryStore,
                                 AttachmentStore attachmentStore,
                                 InvoiceStore invoiceStore,
                                 InvoiceLineItemStore invoiceLineItemStore,
                                 PaymentTransactionStore paymentTransactionStore,
                                 TenantStore tenantStore,
                                 ServiceRequestMapper mapper,
                                 RequestNumberGenerator requestNumberGenerator,
                                 FileStorageService fileStorageService,
                                 NotificationService notificationService,
                                 AuditTrailService auditTrailService,
                                 @Value("${app.repair-center-state-code}") String repairCenterStateCode,
                                 @Value("${app.runner-portal-base-url:http://localhost:5173/runner-access}") String runnerPortalBaseUrl) {
        this.serviceRequestStore = serviceRequestStore;
        this.customerStore = customerStore;
        this.deviceStore = deviceStore;
        this.userStore = userStore;
        this.pickupStore = pickupStore;
        this.estimateStore = estimateStore;
        this.deliveryStore = deliveryStore;
        this.statusHistoryStore = statusHistoryStore;
        this.attachmentStore = attachmentStore;
        this.invoiceStore = invoiceStore;
        this.invoiceLineItemStore = invoiceLineItemStore;
        this.paymentTransactionStore = paymentTransactionStore;
        this.tenantStore = tenantStore;
        this.mapper = mapper;
        this.requestNumberGenerator = requestNumberGenerator;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
        this.auditTrailService = auditTrailService;
        this.repairCenterStateCode = repairCenterStateCode;
        this.runnerPortalBaseUrl = runnerPortalBaseUrl.endsWith("/")
                ? runnerPortalBaseUrl.substring(0, runnerPortalBaseUrl.length() - 1)
                : runnerPortalBaseUrl;
    }

    public ServiceRequestResponse create(CreateServiceRequestRequest request) {
        Tenant tenant = resolveTenant(request.tenantCode());
        Instant now = Instant.now();
        int slaHours = request.promisedSlaHours() != null ? request.promisedSlaHours() : tenant.getDefaultSlaHours();

        Customer customer = new Customer();
        customer.setTenant(tenant);
        customer.setFullName(request.customer().fullName());
        customer.setContactPerson(request.customer().contactPerson());
        customer.setEmail(request.customer().email());
        customer.setSecondaryEmail(request.customer().secondaryEmail());
        customer.setPhone(request.customer().phone());
        customer.setAlternatePhone(request.customer().alternatePhone());
        customer.setWhatsappNumber(request.customer().whatsappNumber());
        customer.setAddressLine1(request.customer().addressLine1());
        customer.setAddressLine2(request.customer().addressLine2());
        customer.setLandmark(request.customer().landmark());
        customer.setGoogleMapLink(request.customer().googleMapLink());
        customer.setCity(request.customer().city());
        customer.setState(request.customer().state());
        customer.setPostalCode(request.customer().postalCode());
        customerStore.save(customer);

        Device device = buildValidatedDevice(request);
        deviceStore.save(device);

        ServiceRequest serviceRequest = new ServiceRequest();
        serviceRequest.setRequestNumber(requestNumberGenerator.next());
        serviceRequest.setTenant(tenant);
        serviceRequest.setLoanNumber(request.loanNumber());
        serviceRequest.setCertificateOfInsuranceNumber(request.certificateOfInsuranceNumber());
        serviceRequest.setPreviousTicketNumber(request.previousTicketNumber());
        serviceRequest.setPartnerReference(request.partnerReference());
        serviceRequest.setProjectName(request.projectName());
        serviceRequest.setBranchName(request.branchName());
        serviceRequest.setEmployeeCode(request.employeeCode());
        serviceRequest.setEmployeeName(request.employeeName());
        serviceRequest.setCustomer(customer);
        serviceRequest.setDevice(device);
        serviceRequest.setIssueSummary(request.issueSummary());
        serviceRequest.setIssueDescription(request.issueDescription());
        serviceRequest.setPriority(request.priority());
        serviceRequest.setSourceChannel(request.sourceChannel());
        serviceRequest.setStatus(RequestStatus.REQUEST_CREATED);
        serviceRequest.setCommittedAt(now);
        serviceRequest.setExpectedCompletionAt(now.plusSeconds(slaHours * 3600L));
        serviceRequest.setSlaDeadlineAt(now.plusSeconds(slaHours * 3600L));
        serviceRequestStore.save(serviceRequest);

        Map<String, Object> after = requestSnapshot(serviceRequest);
        recordHistory(serviceRequest, null, RequestStatus.REQUEST_CREATED, "Service request created", null, after);
        auditTrailService.logChange("ServiceRequest", serviceRequest.getId(), serviceRequest.getId(), "CREATE", null, after, currentUserOrNull());
        notificationService.queueStatusUpdate(serviceRequest, "Request Created", "Your request " + serviceRequest.getRequestNumber() + " has been created.");
        return buildResponse(serviceRequest);
    }

    public List<ServiceRequestResponse> list(RequestStatus status) {
        List<ServiceRequest> requests = status == null
                ? serviceRequestStore.findAllOrderByCreatedAtDesc()
                : serviceRequestStore.findByStatusOrderByCreatedAtDesc(status);
        return requests.stream().map(this::buildResponse).toList();
    }

    public ServiceRequestResponse get(Long id) {
        return buildResponse(findRequest(id));
    }

    public ServiceRequestResponse getByPickupToken(String token) {
        Pickup pickup = findPickupByToken(token);
        return buildResponse(pickup.getServiceRequest());
    }

    public ServiceRequestResponse assignPickup(Long requestId, AssignPickupRequest request) {
        ServiceRequest serviceRequest = findRequest(requestId);
        User agent = findUser(request.agentId());
        Pickup pickup = pickupStore.findByServiceRequest(serviceRequest).orElseGet(Pickup::new);
        Map<String, Object> before = pickupSnapshot(pickup);
        pickup.setServiceRequest(serviceRequest);
        pickup.setAgent(agent);
        pickup.setScheduledAt(request.scheduledAt());
        pickup.setPickupOtp(request.pickupOtp() != null && !request.pickupOtp().isBlank()
                ? request.pickupOtp()
                : generateOtp());
        pickup.setNotes(request.notes());
        pickup.setAcceptedAt(null);
        pickup.setCompletedAt(null);
        pickup.setCustomerConfirmation(false);
        pickup.setRunnerPortalToken(generateRunnerPortalToken());
        pickup.setRunnerLinkSentAt(Instant.now());
        pickupStore.save(pickup);
        serviceRequest.setAssignedPickupAgent(agent);
        transition(serviceRequest, RequestStatus.PICKUP_ASSIGNED, "Pickup assigned");
        auditTrailService.logChange("Pickup", pickup.getId(), serviceRequest.getId(), "UPSERT", before, pickupSnapshot(pickup), currentUserOrNull());
        queuePickupAssignmentNotifications(serviceRequest, pickup);
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse acceptPickupByToken(String token) {
        Pickup pickup = findPickupByToken(token);
        ServiceRequest serviceRequest = pickup.getServiceRequest();
        if (serviceRequest.getStatus() == RequestStatus.PICKUP_COMPLETED) {
            return buildResponse(serviceRequest);
        }
        if (!isRunnerPickupOpenForPortal(serviceRequest)) {
            throw new ApiException("This pickup link is no longer available for acceptance.");
        }

        boolean firstAcceptance = pickup.getAcceptedAt() == null;
        Map<String, Object> before = pickupSnapshot(pickup);
        if (pickup.getAcceptedAt() == null) {
            pickup.setAcceptedAt(Instant.now());
        }
        pickupStore.save(pickup);

        if (serviceRequest.getStatus() == RequestStatus.PICKUP_ASSIGNED) {
            transition(serviceRequest, RequestStatus.PICKUP_IN_PROGRESS, "Runner accepted pickup assignment", pickup.getAgent());
        }

        auditTrailService.logChange("Pickup", pickup.getId(), serviceRequest.getId(), "ACCEPT", before, pickupSnapshot(pickup), pickup.getAgent());
        if (firstAcceptance) {
            queuePickupAcceptedNotifications(serviceRequest, pickup);
        }
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse updatePickupStatusByToken(String token, StatusTransitionRequest request) {
        Pickup pickup = findPickupByToken(token);
        ServiceRequest serviceRequest = pickup.getServiceRequest();
        RequestStatus targetStatus = request != null ? request.targetStatus() : null;
        if (targetStatus == null) {
            throw new ApiException("Pickup status update target is required.");
        }
        if (!RUNNER_PICKUP_CUSTOMER_UPDATE_STATUSES.contains(targetStatus)) {
            throw new ApiException("Runner portal only supports customer not available, customer reschedule, or customer not contactable updates.");
        }
        if (serviceRequest.getStatus() == targetStatus) {
            return buildResponse(serviceRequest);
        }
        if (!isRunnerPickupOpenForPortal(serviceRequest)) {
            throw new ApiException("This pickup link is no longer available for customer updates.");
        }

        Map<String, Object> before = pickupSnapshot(pickup);
        if (pickup.getAcceptedAt() == null) {
            pickup.setAcceptedAt(Instant.now());
        }
        pickup.setCustomerConfirmation(false);
        pickupStore.save(pickup);

        String remarks = request.remarks() != null && !request.remarks().isBlank()
                ? request.remarks().trim()
                : defaultRunnerPickupUpdateRemark(targetStatus);
        transition(serviceRequest, targetStatus, remarks, pickup.getAgent());
        auditTrailService.logChange("Pickup", pickup.getId(), serviceRequest.getId(), "CUSTOMER_UPDATE", before, pickupSnapshot(pickup), pickup.getAgent());
        queuePickupCustomerUpdateNotifications(serviceRequest, pickup, targetStatus, remarks);
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse uploadPickupAttachmentByToken(String token, String attachmentType, MultipartFile file) {
        Pickup pickup = findPickupByToken(token);
        ServiceRequest serviceRequest = pickup.getServiceRequest();
        if (!isRunnerPickupOpenForPortal(serviceRequest)) {
            throw new ApiException("Pickup photos can only be uploaded before pickup completion.");
        }
        if (!attachmentType.startsWith("PICKUP_IMAGE_") && !attachmentType.startsWith("PICKUP_EXTRA_IMAGE_")) {
            throw new ApiException("Runner portal only accepts pickup evidence images.");
        }
        if (pickup.getAcceptedAt() == null) {
            throw new ApiException("Accept the pickup before uploading pickup photos.");
        }
        return uploadAttachmentInternal(serviceRequest, attachmentType, file, pickup.getAgent());
    }

    public ServiceRequestResponse deletePickupAttachmentByToken(String token, Long attachmentId) {
        Pickup pickup = findPickupByToken(token);
        ServiceRequest serviceRequest = pickup.getServiceRequest();
        if (!isRunnerPickupOpenForPortal(serviceRequest)) {
            throw new ApiException("Pickup photos can only be edited before pickup completion.");
        }
        return deleteAttachmentInternal(serviceRequest, attachmentId, pickup.getAgent());
    }

    public ServiceRequestResponse completePickupByToken(String token) {
        Pickup pickup = findPickupByToken(token);
        ServiceRequest serviceRequest = pickup.getServiceRequest();
        if (serviceRequest.getStatus() == RequestStatus.PICKUP_COMPLETED) {
            return buildResponse(serviceRequest);
        }
        if (!isRunnerPickupOpenForPortal(serviceRequest)) {
            throw new ApiException("This pickup link is no longer available for completion.");
        }
        if (pickup.getAcceptedAt() == null) {
            throw new ApiException("Accept the pickup before submitting pickup completion.");
        }

        Map<String, Object> before = pickupSnapshot(pickup);
        if (serviceRequest.getStatus() == RequestStatus.PICKUP_ASSIGNED) {
            transition(serviceRequest, RequestStatus.PICKUP_IN_PROGRESS, "Runner accepted pickup assignment", pickup.getAgent());
        }
        pickup.setCompletedAt(Instant.now());
        pickup.setCustomerConfirmation(true);
        pickupStore.save(pickup);
        transition(serviceRequest, RequestStatus.PICKUP_COMPLETED, "Pickup completed from runner portal with 10 device photos", pickup.getAgent());
        auditTrailService.logChange("Pickup", pickup.getId(), serviceRequest.getId(), "COMPLETE", before, pickupSnapshot(pickup), pickup.getAgent());
        queuePickupCompletedNotifications(serviceRequest, pickup);
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse createEstimate(Long requestId, CreateEstimateRequest request) {
        ServiceRequest serviceRequest = findRequest(requestId);
        BigDecimal total = request.partsCost().add(request.laborCost()).add(request.taxAmount());
        Estimate estimate = estimateStore.findByServiceRequest(serviceRequest).orElseGet(Estimate::new);
        Map<String, Object> before = estimateSnapshot(estimate);
        estimate.setServiceRequest(serviceRequest);
        estimate.setDiagnosisSummary(request.diagnosisSummary());
        estimate.setPartsCost(request.partsCost());
        estimate.setLaborCost(request.laborCost());
        estimate.setTaxAmount(request.taxAmount());
        estimate.setTotalAmount(total);
        estimateStore.save(estimate);
        transition(serviceRequest, RequestStatus.ESTIMATE_PREPARED, "Estimate prepared");
        auditTrailService.logChange("Estimate", estimate.getId(), serviceRequest.getId(), "UPSERT", before, estimateSnapshot(estimate), currentUserOrNull());
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse approveEstimate(Long requestId, String remarks) {
        ServiceRequest serviceRequest = findRequest(requestId);
        Estimate estimate = estimateStore.findByServiceRequest(serviceRequest)
                .orElseThrow(() -> new NotFoundException("Estimate not found for request " + requestId));
        Map<String, Object> before = estimateSnapshot(estimate);
        estimate.setApproved(true);
        estimate.setApprovedAt(Instant.now());
        estimate.setApprovedBy(currentUser());
        estimateStore.save(estimate);
        RequestStatus targetStatus = serviceRequest.getStatus() == RequestStatus.CASHLESS_PENDING_APPROVAL
                ? RequestStatus.CASHLESS_APPROVED
                : RequestStatus.ESTIMATE_APPROVED;
        transition(serviceRequest, targetStatus, remarks != null ? remarks : "Estimate approved");
        auditTrailService.logChange("Estimate", estimate.getId(), serviceRequest.getId(), "APPROVE", before, estimateSnapshot(estimate), currentUserOrNull());
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse transitionStatus(Long requestId, StatusTransitionRequest request) {
        ServiceRequest serviceRequest = findRequest(requestId);
        transition(serviceRequest, request.targetStatus(), request.remarks());
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse assignDelivery(Long requestId, AssignDeliveryRequest request) {
        ServiceRequest serviceRequest = findRequest(requestId);
        User agent = findUser(request.agentId());
        Delivery delivery = deliveryStore.findByServiceRequest(serviceRequest).orElseGet(Delivery::new);
        Map<String, Object> before = deliverySnapshot(delivery);
        delivery.setServiceRequest(serviceRequest);
        delivery.setAgent(agent);
        delivery.setScheduledAt(request.scheduledAt());
        delivery.setOtpCode(request.otpCode());
        delivery.setNotes(request.notes());
        deliveryStore.save(delivery);
        serviceRequest.setAssignedDeliveryAgent(agent);
        transition(serviceRequest, RequestStatus.DELIVERY_ASSIGNED, "Delivery assigned");
        auditTrailService.logChange("Delivery", delivery.getId(), serviceRequest.getId(), "UPSERT", before, deliverySnapshot(delivery), currentUserOrNull());
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse uploadAttachment(Long requestId, String attachmentType, MultipartFile file) {
        ServiceRequest serviceRequest = findRequest(requestId);
        return uploadAttachmentInternal(serviceRequest, attachmentType, file, currentUserOrNull());
    }

    public ServiceRequestResponse deleteAttachment(Long requestId, Long attachmentId) {
        ServiceRequest serviceRequest = findRequest(requestId);
        return deleteAttachmentInternal(serviceRequest, attachmentId, currentUserOrNull());
    }

    public ServiceRequestResponse createInvoice(Long requestId, CreateInvoiceRequest request) {
        ServiceRequest serviceRequest = findRequest(requestId);
        Estimate estimate = estimateStore.findByServiceRequest(serviceRequest)
                .orElseThrow(() -> new NotFoundException("Estimate not found for request " + requestId));
        if (invoiceStore.findByServiceRequest(serviceRequest).isPresent()) {
            throw new ApiException("Invoice already exists for request " + requestId);
        }
        BigDecimal subtotal = estimate.getLaborCost().add(estimate.getPartsCost());
        BigDecimal taxAmount = subtotal.multiply(request.gstRate()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        GstType gstType = request.billingStateCode().equals(request.placeOfSupply()) ? GstType.CGST_SGST : GstType.IGST;
        BigDecimal cgst = gstType == GstType.CGST_SGST ? taxAmount.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal sgst = gstType == GstType.CGST_SGST ? taxAmount.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal igst = gstType == GstType.IGST ? taxAmount : BigDecimal.ZERO;
        BigDecimal total = subtotal.add(taxAmount);

        Invoice invoice = new Invoice();
        invoice.setServiceRequest(serviceRequest);
        invoice.setTenant(serviceRequest.getTenant());
        invoice.setInvoiceNumber("INV-" + serviceRequest.getRequestNumber());
        invoice.setCustomerGstin(request.customerGstin());
        invoice.setBillingStateCode(request.billingStateCode());
        invoice.setPlaceOfSupply(request.placeOfSupply());
        invoice.setGstType(gstType);
        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(taxAmount);
        invoice.setTotalAmount(total);
        invoice.setCgstAmount(cgst);
        invoice.setSgstAmount(sgst);
        invoice.setIgstAmount(igst);
        invoice.setAmountDue(total);
        invoice.setPaymentStatus(PaymentStatus.PENDING.name());
        invoice.setIssuedAt(Instant.now());
        invoiceStore.save(invoice);
        persistInvoiceItems(invoice, estimate, request, gstType == GstType.CGST_SGST ? request.gstRate().divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP) : request.gstRate());
        auditTrailService.logChange("Invoice", invoice.getId(), serviceRequest.getId(), "CREATE", null, invoiceSnapshot(invoice), currentUserOrNull());
        if (serviceRequest.getStatus() == RequestStatus.DELIVERED || serviceRequest.getStatus() == RequestStatus.TOTAL_LOSS) {
            transition(serviceRequest, RequestStatus.INVOICED, "GST invoice generated");
        }
        notificationService.queueStatusUpdate(serviceRequest, "Invoice Ready", "Invoice " + invoice.getInvoiceNumber() + " has been generated.");
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse recordPayment(Long requestId, RecordPaymentRequest request) {
        ServiceRequest serviceRequest = findRequest(requestId);
        Invoice invoice = invoiceStore.findByServiceRequest(serviceRequest)
                .orElseThrow(() -> new NotFoundException("Invoice not found for request " + requestId));
        PaymentTransaction payment = new PaymentTransaction();
        payment.setTenant(serviceRequest.getTenant());
        payment.setServiceRequest(serviceRequest);
        payment.setInvoice(invoice);
        payment.setPaymentReference(request.paymentReference());
        payment.setAmount(request.amount());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setUtrNumber(request.utrNumber());
        payment.setPaymentStatus(PaymentStatus.CAPTURED);
        payment.setReconciliationStatus(com.gadgetseva.entity.PaymentReconciliationStatus.PENDING);
        payment.setPaidAt(Instant.now());
        payment.setMetadataJson(request.metadataJson());
        paymentTransactionStore.save(payment);

        invoice.setAmountPaid(invoice.getAmountPaid().add(request.amount()));
        invoice.setAmountDue(invoice.getTotalAmount().subtract(invoice.getAmountPaid()).max(BigDecimal.ZERO));
        invoice.setPaymentStatus(invoice.getAmountDue().compareTo(BigDecimal.ZERO) == 0 ? PaymentStatus.CAPTURED.name() : "PARTIAL");
        if (invoice.getAmountDue().compareTo(BigDecimal.ZERO) == 0) {
            invoice.setPaidAt(Instant.now());
        }
        invoiceStore.save(invoice);
        auditTrailService.logChange("Payment", payment.getId(), serviceRequest.getId(), "CAPTURE", null, paymentSnapshot(payment), currentUserOrNull());
        notificationService.queueStatusUpdate(serviceRequest, "Payment Recorded", "Payment received against invoice " + invoice.getInvoiceNumber());
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse reconcilePayment(Long requestId, Long paymentId, com.gadgetseva.dto.ReconcilePaymentRequest request) {
        ServiceRequest serviceRequest = findRequest(requestId);
        PaymentTransaction payment = paymentTransactionStore.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("Payment not found: " + paymentId));
        if (!payment.getServiceRequest().getId().equals(serviceRequest.getId())) {
            throw new ApiException("Payment does not belong to request " + requestId);
        }
        payment.setReconciliationStatus(request.reconciliationStatus());
        payment.setReconciliationRemarks(request.remarks());
        payment.setReconciledAt(Instant.now());
        paymentTransactionStore.save(payment);
        auditTrailService.logChange("Payment", payment.getId(), serviceRequest.getId(), "RECONCILE", null, paymentSnapshot(payment), currentUserOrNull());
        notificationService.queueStatusUpdate(serviceRequest, "Payment Reconciled", "Payment " + payment.getPaymentReference() + " was marked as " + request.reconciliationStatus().name());
        return buildResponse(serviceRequest);
    }
    public ServiceRequestResponse refundPayment(Long requestId, RefundPaymentRequest request) {
        ServiceRequest serviceRequest = findRequest(requestId);
        PaymentTransaction payment = paymentTransactionStore.findById(request.paymentId())
                .orElseThrow(() -> new NotFoundException("Payment not found: " + request.paymentId()));
        if (!payment.getServiceRequest().getId().equals(serviceRequest.getId())) {
            throw new ApiException("Payment does not belong to request " + requestId);
        }
        Invoice invoice = payment.getInvoice();
        payment.setRefundAmount(payment.getRefundAmount().add(request.amount()));
        payment.setRefundReason(request.reason());
        payment.setRefundStatus(RefundStatus.PROCESSED);
        payment.setRefundedAt(Instant.now());
        payment.setPaymentStatus(payment.getRefundAmount().compareTo(payment.getAmount()) >= 0 ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED);
        paymentTransactionStore.save(payment);

        invoice.setRefundAmount(invoice.getRefundAmount().add(request.amount()));
        invoice.setAmountPaid(invoice.getAmountPaid().subtract(request.amount()).max(BigDecimal.ZERO));
        invoice.setAmountDue(invoice.getTotalAmount().subtract(invoice.getAmountPaid()).max(BigDecimal.ZERO));
        invoice.setPaymentStatus(payment.getPaymentStatus().name());
        invoiceStore.save(invoice);
        auditTrailService.logChange("Payment", payment.getId(), serviceRequest.getId(), "REFUND", null, paymentSnapshot(payment), currentUserOrNull());
        notificationService.queueStatusUpdate(serviceRequest, "Refund Processed", "Refund processed for invoice " + invoice.getInvoiceNumber());
        return buildResponse(serviceRequest);
    }

    public DeviceScanResponse scanQr(DeviceScanRequest request) {
        String extracted = ImeiTools.extractImeiFromQr(request.qrCodePayload()).orElse(null);
        boolean valid = extracted != null && ImeiTools.isValid(extracted);
        return new DeviceScanResponse(extracted, valid, valid ? ImeiValidationStatus.QR_EXTRACTED.name() : ImeiValidationStatus.INVALID.name(), request.qrCodePayload());
    }

    @Scheduled(fixedDelay = 300000)
    public void evaluateSlaBreaches() {
        List<ServiceRequest> overdue = serviceRequestStore.findBySlaBreachedFalseAndStatusNotInAndSlaDeadlineAtBefore(List.of(RequestStatus.CLOSED), Instant.now());
        for (ServiceRequest serviceRequest : overdue) {
            serviceRequest.setSlaBreached(true);
            serviceRequest.setBreachReason("SLA breached at " + Instant.now());
            serviceRequest.setLastSlaAlertAt(Instant.now());
            serviceRequestStore.save(serviceRequest);
            auditTrailService.logChange("ServiceRequest", serviceRequest.getId(), serviceRequest.getId(), "SLA_BREACH", null, requestSnapshot(serviceRequest), null);
            notificationService.queueAlert(serviceRequest, "ops@" + serviceRequest.getTenant().getCode().toLowerCase() + ".local", "SLA Breach Alert", "Request " + serviceRequest.getRequestNumber() + " has breached its SLA.");
        }
    }

    private Device buildValidatedDevice(CreateServiceRequestRequest request) {
        Device device = deviceStore.findBySerialNumber(request.device().serialNumber()).orElseGet(Device::new);
        device.setBrand(request.device().brand());
        device.setModel(request.device().model());
        device.setDeviceCategory(request.device().deviceCategory() != null ? request.device().deviceCategory() : DeviceCategory.MOBILE);
        device.setSerialNumber(request.device().serialNumber());
        device.setWarrantyStatus(request.device().warrantyStatus());
        device.setDeviceCondition(request.device().deviceCondition());
        device.setQrCodePayload(request.device().qrCodePayload());
        String imei = request.device().imeiNumber();
        if ((imei == null || imei.isBlank()) && request.device().qrCodePayload() != null) {
            imei = ImeiTools.extractImeiFromQr(request.device().qrCodePayload()).orElse(null);
            if (imei != null) {
                device.setImeiValidationStatus(ImeiValidationStatus.QR_EXTRACTED);
            }
        }
        if (imei != null && !imei.isBlank()) {
            if (!ImeiTools.isValid(imei)) {
                throw new ApiException("Invalid IMEI supplied or extracted from QR payload");
            }
            device.setImeiNumber(imei);
            if (device.getImeiValidationStatus() != ImeiValidationStatus.QR_EXTRACTED) {
                device.setImeiValidationStatus(ImeiValidationStatus.VALID);
            }
        }
        return device;
    }

    private void persistInvoiceItems(Invoice invoice, Estimate estimate, CreateInvoiceRequest request, BigDecimal effectiveRate) {
        InvoiceLineItem labor = new InvoiceLineItem();
        labor.setInvoice(invoice);
        labor.setDescription(request.laborDescription());
        labor.setQuantity(1);
        labor.setUnitPrice(estimate.getLaborCost());
        labor.setTaxableValue(estimate.getLaborCost());
        labor.setGstRate(effectiveRate);
        labor.setLineTotal(estimate.getLaborCost());
        invoiceLineItemStore.save(labor);
        if (estimate.getPartsCost().compareTo(BigDecimal.ZERO) > 0) {
            InvoiceLineItem parts = new InvoiceLineItem();
            parts.setInvoice(invoice);
            parts.setDescription(request.partsDescription() != null && !request.partsDescription().isBlank() ? request.partsDescription() : "Spare parts and consumables");
            parts.setQuantity(1);
            parts.setUnitPrice(estimate.getPartsCost());
            parts.setTaxableValue(estimate.getPartsCost());
            parts.setGstRate(effectiveRate);
            parts.setLineTotal(estimate.getPartsCost());
            invoiceLineItemStore.save(parts);
        }
    }

    private ServiceRequest findRequest(Long id) {
        return serviceRequestStore.findById(id).orElseThrow(() -> new NotFoundException("Service request not found: " + id));
    }

    private User findUser(Long userId) {
        return userStore.findById(userId).orElseThrow(() -> new NotFoundException("User not found: " + userId));
    }

    private Pickup findPickupByToken(String token) {
        if (token == null || token.isBlank()) {
            throw new NotFoundException("Runner pickup link is invalid");
        }
        return pickupStore.findByRunnerPortalToken(token)
                .orElseThrow(() -> new NotFoundException("Runner pickup link not found"));
    }

    private Tenant resolveTenant(String tenantCode) {
        String effectiveCode = tenantCode != null && !tenantCode.isBlank() ? tenantCode : "GSH-CORE";
        return tenantStore.findByCode(effectiveCode).orElseThrow(() -> new NotFoundException("Tenant not found: " + effectiveCode));
    }

    private void transition(ServiceRequest serviceRequest, RequestStatus targetStatus, String remarks) {
        transition(serviceRequest, targetStatus, remarks, currentUserOrNull());
    }

    private void transition(ServiceRequest serviceRequest, RequestStatus targetStatus, String remarks, User actor) {
        Map<String, Object> before = requestSnapshot(serviceRequest);
        if (targetStatus == RequestStatus.PICKUP_COMPLETED) {
            long pickupPhotos = attachmentStore.countByServiceRequestAndAttachmentTypeStartingWith(serviceRequest, "PICKUP_IMAGE_");
            if (pickupPhotos < REQUIRED_PICKUP_PHOTO_COUNT) {
                throw new ApiException("Upload all 10 required pickup photos before marking pickup completed");
            }
        }
        StatusTransitionRules.assertAllowed(serviceRequest.getStatus(), targetStatus);
        RequestStatus previous = serviceRequest.getStatus();
        serviceRequest.setStatus(targetStatus);
        if (targetStatus == RequestStatus.CLOSED) {
            serviceRequest.setActualResolutionAt(Instant.now());
            serviceRequest.setTatMinutes((serviceRequest.getActualResolutionAt().toEpochMilli() - serviceRequest.getCommittedAt().toEpochMilli()) / 60000L);
            if (serviceRequest.getActualResolutionAt().isAfter(serviceRequest.getSlaDeadlineAt())) {
                serviceRequest.setSlaBreached(true);
                serviceRequest.setBreachReason("Closed after SLA deadline");
            }
        }
        serviceRequestStore.save(serviceRequest);
        Map<String, Object> after = requestSnapshot(serviceRequest);
        recordHistory(serviceRequest, previous, targetStatus, remarks, before, after, actor);
        auditTrailService.logChange("ServiceRequest", serviceRequest.getId(), serviceRequest.getId(), "STATUS_CHANGE", before, after, actor);
        notificationService.queueStatusUpdate(serviceRequest, "Request Update", "Request " + serviceRequest.getRequestNumber() + " moved to " + targetStatus);
    }

    private void recordHistory(ServiceRequest serviceRequest, RequestStatus previous, RequestStatus targetStatus, String remarks, Object before, Object after) {
        recordHistory(serviceRequest, previous, targetStatus, remarks, before, after, currentUserOrNull());
    }

    private void recordHistory(ServiceRequest serviceRequest,
                               RequestStatus previous,
                               RequestStatus targetStatus,
                               String remarks,
                               Object before,
                               Object after,
                               User actor) {
        StatusHistory history = new StatusHistory();
        history.setServiceRequest(serviceRequest);
        history.setFromStatus(previous != null ? previous.name() : null);
        history.setToStatus(targetStatus.name());
        history.setRemarks(remarks);
        history.setChangedBy(actor);
        history.setChangedAt(Instant.now());
        history.setBeforeValueJson(auditTrailService.toJson(before));
        history.setAfterValueJson(auditTrailService.toJson(after));
        statusHistoryStore.save(history);
    }

    private ServiceRequestResponse buildResponse(ServiceRequest serviceRequest) {
        Pickup pickup = pickupStore.findByServiceRequest(serviceRequest).orElse(null);
        if (pickup != null && (pickup.getRunnerPortalToken() == null || pickup.getRunnerPortalToken().isBlank())) {
            pickup.setRunnerPortalToken(generateRunnerPortalToken());
            pickup.setRunnerLinkSentAt(pickup.getRunnerLinkSentAt() != null ? pickup.getRunnerLinkSentAt() : Instant.now());
            pickupStore.save(pickup);
        }
        List<StatusHistory> history = statusHistoryStore.findByServiceRequestOrderByChangedAtAsc(serviceRequest);
        List<Attachment> attachments = attachmentStore.findByServiceRequest(serviceRequest);
        Invoice invoice = invoiceStore.findByServiceRequest(serviceRequest).orElse(null);
        List<InvoiceLineItem> invoiceItems = invoice != null ? invoiceLineItemStore.findByInvoiceOrderByIdAsc(invoice) : List.of();
        List<PaymentTransaction> payments = paymentTransactionStore.findByServiceRequestOrderByCreatedAtDesc(serviceRequest);
        List<NotificationLog> notifications = notificationService.listForRequest(serviceRequest.getId());
        return mapper.toResponse(serviceRequest, pickup, runnerPortalBaseUrl, history, attachments, invoice, invoiceItems, payments, notifications, auditTrailService.listForRequest(serviceRequest.getId()));
    }

    private ServiceRequestResponse uploadAttachmentInternal(ServiceRequest serviceRequest,
                                                            String attachmentType,
                                                            MultipartFile file,
                                                            User actor) {
        validateAttachmentUpload(serviceRequest, attachmentType);
        StoredFileDescriptor storedFile = fileStorageService.store(serviceRequest.getId(), file);
        Attachment attachment = new Attachment();
        attachment.setServiceRequest(serviceRequest);
        attachment.setTenant(serviceRequest.getTenant());
        attachment.setAttachmentType(attachmentType);
        attachment.setFileName(file.getOriginalFilename());
        attachment.setContentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
        attachment.setObjectKey(storedFile.objectKey());
        attachment.setChecksum(storedFile.checksum());
        attachment.setPrivateFile(true);
        attachment.setSignedUrlExpiresAt(Instant.now().plusSeconds(900));
        attachment.setUploadedBy(actor);
        attachment.setUploadedAt(Instant.now());
        attachmentStore.save(attachment);
        maybeAdvanceEvidenceWorkflow(serviceRequest, actor);
        auditTrailService.logChange("Attachment", attachment.getId(), serviceRequest.getId(), "UPLOAD", null, attachmentSnapshot(attachment), actor);
        return buildResponse(serviceRequest);
    }

    private ServiceRequestResponse deleteAttachmentInternal(ServiceRequest serviceRequest, Long attachmentId, User actor) {
        Attachment attachment = attachmentStore.findByIdAndServiceRequest(attachmentId, serviceRequest)
                .orElseThrow(() -> new NotFoundException("Attachment not found: " + attachmentId));
        if (serviceRequest.getStatus() == RequestStatus.CASHLESS_APPROVED && attachment.getAttachmentType().startsWith("CASHLESS_")) {
            throw new ApiException("Approved cashless evidence cannot be removed");
        }
        if (serviceRequest.getStatus() == RequestStatus.PICKUP_COMPLETED
                && (attachment.getAttachmentType().startsWith("PICKUP_IMAGE_") || attachment.getAttachmentType().startsWith("PICKUP_EXTRA_IMAGE_"))) {
            if (actor == null || actor.getRole() == null || actor.getRole().getName() == RoleName.PICKUP_AGENT) {
                throw new ApiException("Completed pickup evidence cannot be edited from the runner link");
            }
        }

        Map<String, Object> before = attachmentSnapshot(attachment);
        fileStorageService.delete(attachment.getObjectKey());
        attachmentStore.delete(attachment);

        if (serviceRequest.getStatus() == RequestStatus.CASHLESS_PENDING_APPROVAL && attachment.getAttachmentType().startsWith("CASHLESS_") && !hasCompleteCashlessEvidence(serviceRequest)) {
            transition(serviceRequest, RequestStatus.CASHLESS_REVISION_REQUIRED, "Cashless evidence removed and requires revision", actor);
        }

        auditTrailService.logChange("Attachment", attachmentId, serviceRequest.getId(), "DELETE", before, null, actor);
        return buildResponse(serviceRequest);
    }

    private void validateAttachmentUpload(ServiceRequest serviceRequest, String attachmentType) {
        if (attachmentType == null || attachmentType.isBlank()) {
            throw new ApiException("Attachment type is required");
        }
        validateAttachmentType(attachmentType);
        if (attachmentStore.existsByServiceRequestAndAttachmentType(serviceRequest, attachmentType)) {
            throw new ApiException("Attachment already uploaded for type " + attachmentType);
        }
        enforceGroupedAttachmentLimit(serviceRequest, attachmentType, "PICKUP_IMAGE_", REQUIRED_PICKUP_PHOTO_COUNT, "Pickup requires exactly 10 required device photos");
        enforceGroupedAttachmentLimit(serviceRequest, attachmentType, "PICKUP_EXTRA_IMAGE_", MAX_PICKUP_EXTRA_PHOTO_COUNT, "Pickup allows up to 20 optional extra images");
        enforceGroupedAttachmentLimit(serviceRequest, attachmentType, "CASHLESS_DEVICE_IMAGE_", 6, "Cashless review allows 6 device images");
        enforceGroupedAttachmentLimit(serviceRequest, attachmentType, "CASHLESS_DAMAGE_IMAGE_", 4, "Cashless review allows 4 damage images");
    }

    private void enforceGroupedAttachmentLimit(ServiceRequest serviceRequest,
                                               String attachmentType,
                                               String prefix,
                                               int maxAllowed,
                                               String message) {
        if (!attachmentType.startsWith(prefix)) {
            return;
        }
        long existing = attachmentStore.countByServiceRequestAndAttachmentTypeStartingWith(serviceRequest, prefix);
        if (existing >= maxAllowed) {
            throw new ApiException(message);
        }
    }

    private void validateAttachmentType(String attachmentType) {
        if (attachmentType.startsWith("PICKUP_IMAGE_") && !REQUIRED_PICKUP_ATTACHMENT_TYPES.contains(attachmentType)) {
            throw new ApiException("Unsupported pickup image type " + attachmentType);
        }
        if (attachmentType.startsWith("PICKUP_EXTRA_IMAGE_") && !attachmentType.matches("PICKUP_EXTRA_IMAGE_\\d{1,2}")) {
            throw new ApiException("Unsupported pickup extra image type " + attachmentType);
        }
    }

    private void maybeAdvanceEvidenceWorkflow(ServiceRequest serviceRequest) {
        maybeAdvanceEvidenceWorkflow(serviceRequest, currentUserOrNull());
    }

    private void maybeAdvanceEvidenceWorkflow(ServiceRequest serviceRequest, User actor) {
        if ((serviceRequest.getStatus() == RequestStatus.ESTIMATE_PREPARED || serviceRequest.getStatus() == RequestStatus.CASHLESS_REVISION_REQUIRED)
                && hasCompleteCashlessEvidence(serviceRequest)) {
            transition(serviceRequest, RequestStatus.CASHLESS_PENDING_APPROVAL, "Cashless evidence set completed", actor);
        }
    }

    private boolean isRunnerPickupOpenForPortal(ServiceRequest serviceRequest) {
        return RUNNER_PICKUP_ACTIVE_STATUSES.contains(serviceRequest.getStatus());
    }

    private boolean hasCompleteCashlessEvidence(ServiceRequest serviceRequest) {
        long cashlessDevicePhotos = attachmentStore.countByServiceRequestAndAttachmentTypeStartingWith(serviceRequest, "CASHLESS_DEVICE_IMAGE_");
        long cashlessDamagePhotos = attachmentStore.countByServiceRequestAndAttachmentTypeStartingWith(serviceRequest, "CASHLESS_DAMAGE_IMAGE_");
        return cashlessDevicePhotos >= 6 && cashlessDamagePhotos >= 4;
    }

    private void queuePickupAssignmentNotifications(ServiceRequest serviceRequest, Pickup pickup) {
        String portalLink = resolveRunnerPortalLink(pickup.getRunnerPortalToken());
        String runnerMessage = "Pickup request " + serviceRequest.getRequestNumber()
                + " has been assigned to you for " + pickup.getScheduledAt()
                + ". Open the runner portal: " + portalLink;
        Map<String, Object> runnerPayload = new LinkedHashMap<>();
        runnerPayload.put("portalLink", portalLink);
        runnerPayload.put("runnerPortalToken", pickup.getRunnerPortalToken());
        runnerPayload.put("requestNumber", serviceRequest.getRequestNumber());
        runnerPayload.put("scheduledAt", pickup.getScheduledAt());
        runnerPayload.put("runnerUsername", pickup.getAgent() != null ? pickup.getAgent().getUsername() : null);
        runnerPayload.put("runnerPhone", pickup.getAgent() != null ? pickup.getAgent().getPhone() : null);
        queueDirectNotification(serviceRequest, "SMS", pickup.getAgent() != null ? pickup.getAgent().getPhone() : null,
                "Pickup Runner Link", runnerMessage, runnerPayload);
        queueDirectNotification(serviceRequest, "WHATSAPP", resolveWhatsappRecipient(pickup.getAgent()),
                "Pickup Runner Link", runnerMessage, runnerPayload);
        queueDirectNotification(serviceRequest, "APP", pickup.getAgent() != null ? pickup.getAgent().getUsername() : null,
                "Pickup Assigned In App", runnerMessage, runnerPayload);

        String customerMessage = "Pickup is scheduled for request " + serviceRequest.getRequestNumber()
                + ". Runner: " + (pickup.getAgent() != null ? pickup.getAgent().getFullName() : "Assigned runner")
                + ". Scheduled at " + pickup.getScheduledAt() + ".";
        queueCustomerNotifications(serviceRequest, "Pickup Scheduled", customerMessage);
    }

    private void queuePickupAcceptedNotifications(ServiceRequest serviceRequest, Pickup pickup) {
        String message = "Pickup runner " + (pickup.getAgent() != null ? pickup.getAgent().getFullName() : "assigned runner")
                + " has accepted request " + serviceRequest.getRequestNumber() + ".";
        queueCustomerNotifications(serviceRequest, "Pickup Accepted", message);
        queueAdminNotifications(serviceRequest, "Pickup Accepted", message);
    }

    private void queuePickupCompletedNotifications(ServiceRequest serviceRequest, Pickup pickup) {
        String message = "Pickup for request " + serviceRequest.getRequestNumber()
                + " is completed with 10 required photos and optional supporting images uploaded by "
                + (pickup.getAgent() != null ? pickup.getAgent().getFullName() : "the runner") + ".";
        queueCustomerNotifications(serviceRequest, "Pickup Completed", message);
        queueAdminNotifications(serviceRequest, "Pickup Completed", message);
    }

    private void queuePickupCustomerUpdateNotifications(ServiceRequest serviceRequest,
                                                        Pickup pickup,
                                                        RequestStatus targetStatus,
                                                        String remarks) {
        String statusLabel = pickupStatusLabel(targetStatus);
        String defaultRemark = defaultRunnerPickupUpdateRemark(targetStatus);
        String message = "Pickup for request " + serviceRequest.getRequestNumber()
                + " was updated as " + statusLabel + " by "
                + (pickup.getAgent() != null ? pickup.getAgent().getFullName() : "the runner")
                + ". Admin team can review the next pickup action.";
        if (remarks != null && !remarks.isBlank() && !remarks.equals(defaultRemark)) {
            message += " Note: " + remarks;
        }
        queueCustomerNotifications(serviceRequest, "Pickup Update - " + statusLabel, message);
        queueAdminNotifications(serviceRequest, "Pickup Update - " + statusLabel, message);
    }

    private void queueCustomerNotifications(ServiceRequest serviceRequest, String subject, String message) {
        Customer customer = serviceRequest.getCustomer();
        queueDirectNotification(serviceRequest, "SMS", customer.getPhone(), subject, message, Map.of("audience", "customer"));
        queueDirectNotification(serviceRequest, "WHATSAPP", customer.getWhatsappNumber(), subject, message, Map.of("audience", "customer"));
        if (customer.getAlternatePhone() != null && !customer.getAlternatePhone().isBlank()) {
            queueDirectNotification(serviceRequest, "SMS", customer.getAlternatePhone(), subject, message, Map.of("audience", "customer-alternate"));
        }
    }

    private void queueAdminNotifications(ServiceRequest serviceRequest, String subject, String message) {
        Set<String> dispatched = new LinkedHashSet<>();
        for (RoleName roleName : List.of(RoleName.ADMIN, RoleName.BACKEND_TEAM)) {
            for (User user : userStore.findByRoleOrderByFullNameAsc(roleName)) {
                if (!user.isActive()) {
                    continue;
                }
                if (user.getEmail() != null && !user.getEmail().isBlank() && dispatched.add("EMAIL:" + user.getEmail())) {
                    queueDirectNotification(serviceRequest, "EMAIL", user.getEmail(), subject, message, Map.of("audience", "admin"));
                }
                if (user.getPhone() != null && !user.getPhone().isBlank() && dispatched.add("SMS:" + user.getPhone())) {
                    queueDirectNotification(serviceRequest, "SMS", user.getPhone(), subject, message, Map.of("audience", "admin"));
                }
                String whatsappRecipient = resolveWhatsappRecipient(user);
                if (whatsappRecipient != null && !whatsappRecipient.isBlank() && dispatched.add("WHATSAPP:" + whatsappRecipient)) {
                    queueDirectNotification(serviceRequest, "WHATSAPP", whatsappRecipient, subject, message, Map.of("audience", "admin"));
                }
            }
        }
    }

    private void queueDirectNotification(ServiceRequest serviceRequest,
                                         String channel,
                                         String recipient,
                                         String subject,
                                         String message,
                                         Map<String, Object> payload) {
        if (recipient == null || recipient.isBlank()) {
            return;
        }
        notificationService.queueNotification(serviceRequest, channel, recipient, subject, message, auditTrailService.toJson(payload));
    }

    private String resolveRunnerPortalLink(String token) {
        return token == null || token.isBlank() ? null : runnerPortalBaseUrl + "/" + token;
    }

    private String defaultRunnerPickupUpdateRemark(RequestStatus targetStatus) {
        return switch (targetStatus) {
            case CUSTOMER_NOT_AVAILABLE -> "Runner marked customer as not available at the pickup location";
            case CUSTOMER_RESCHEDULED -> "Runner marked pickup as customer reschedule requested";
            case CUSTOMER_NOT_CONTACTABLE -> "Runner marked customer as not contactable for pickup";
            default -> "Runner updated pickup status";
        };
    }

    private String pickupStatusLabel(RequestStatus status) {
        return switch (status) {
            case CUSTOMER_NOT_AVAILABLE -> "Customer Not Available";
            case CUSTOMER_RESCHEDULED -> "Customer Reschedule";
            case CUSTOMER_NOT_CONTACTABLE -> "Customer Not Contactable";
            default -> status.name().replace('_', ' ');
        };
    }

    private String resolveWhatsappRecipient(User user) {
        if (user == null) {
            return null;
        }
        return user.getWhatsappNumber() != null && !user.getWhatsappNumber().isBlank()
                ? user.getWhatsappNumber()
                : user.getPhone();
    }

    private String generateRunnerPortalToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private String generateOtp() {
        return String.valueOf(ThreadLocalRandom.current().nextInt(1000, 10000));
    }

    private Map<String, Object> requestSnapshot(ServiceRequest serviceRequest) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("status", serviceRequest.getStatus() != null ? serviceRequest.getStatus().name() : null);
        snapshot.put("tenant", serviceRequest.getTenant() != null ? serviceRequest.getTenant().getCode() : null);
        snapshot.put("loanNumber", serviceRequest.getLoanNumber());
        snapshot.put("certificateOfInsuranceNumber", serviceRequest.getCertificateOfInsuranceNumber());
        snapshot.put("previousTicketNumber", serviceRequest.getPreviousTicketNumber());
        snapshot.put("partnerReference", serviceRequest.getPartnerReference());
        snapshot.put("deviceCategory", serviceRequest.getDevice() != null && serviceRequest.getDevice().getDeviceCategory() != null
                ? serviceRequest.getDevice().getDeviceCategory().name() : DeviceCategory.MOBILE.name());
        snapshot.put("slaDeadlineAt", serviceRequest.getSlaDeadlineAt());
        snapshot.put("slaBreached", serviceRequest.isSlaBreached());
        snapshot.put("repairCenterStateCode", repairCenterStateCode);
        snapshot.put("pickupAgent", serviceRequest.getAssignedPickupAgent() != null ? serviceRequest.getAssignedPickupAgent().getUsername() : null);
        snapshot.put("deliveryAgent", serviceRequest.getAssignedDeliveryAgent() != null ? serviceRequest.getAssignedDeliveryAgent().getUsername() : null);
        return snapshot;
    }

    private Map<String, Object> pickupSnapshot(Pickup pickup) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        if (pickup.getId() != null) {
            snapshot.put("id", pickup.getId());
        }
        snapshot.put("agent", pickup.getAgent() != null ? pickup.getAgent().getUsername() : null);
        snapshot.put("scheduledAt", pickup.getScheduledAt());
        snapshot.put("otp", pickup.getPickupOtp());
        snapshot.put("acceptedAt", pickup.getAcceptedAt());
        snapshot.put("completedAt", pickup.getCompletedAt());
        snapshot.put("runnerPortalLink", resolveRunnerPortalLink(pickup.getRunnerPortalToken()));
        return snapshot;
    }

    private Map<String, Object> deliverySnapshot(Delivery delivery) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        if (delivery.getId() != null) {
            snapshot.put("id", delivery.getId());
        }
        snapshot.put("agent", delivery.getAgent() != null ? delivery.getAgent().getUsername() : null);
        snapshot.put("scheduledAt", delivery.getScheduledAt());
        snapshot.put("otp", delivery.getOtpCode());
        return snapshot;
    }

    private Map<String, Object> estimateSnapshot(Estimate estimate) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        if (estimate.getId() != null) {
            snapshot.put("id", estimate.getId());
        }
        snapshot.put("diagnosisSummary", estimate.getDiagnosisSummary());
        snapshot.put("partsCost", estimate.getPartsCost());
        snapshot.put("laborCost", estimate.getLaborCost());
        snapshot.put("totalAmount", estimate.getTotalAmount());
        snapshot.put("approved", estimate.isApproved());
        return snapshot;
    }

    private Map<String, Object> attachmentSnapshot(Attachment attachment) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("id", attachment.getId());
        snapshot.put("attachmentType", attachment.getAttachmentType());
        snapshot.put("fileName", attachment.getFileName());
        snapshot.put("checksum", attachment.getChecksum());
        snapshot.put("objectKey", attachment.getObjectKey());
        return snapshot;
    }

    private Map<String, Object> invoiceSnapshot(Invoice invoice) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("invoiceNumber", invoice.getInvoiceNumber());
        snapshot.put("gstType", invoice.getGstType().name());
        snapshot.put("totalAmount", invoice.getTotalAmount());
        snapshot.put("amountDue", invoice.getAmountDue());
        snapshot.put("paymentStatus", invoice.getPaymentStatus());
        return snapshot;
    }

    private Map<String, Object> paymentSnapshot(PaymentTransaction payment) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("paymentReference", payment.getPaymentReference());
        snapshot.put("utrNumber", payment.getUtrNumber());
        snapshot.put("amount", payment.getAmount());
        snapshot.put("status", payment.getPaymentStatus().name());
        snapshot.put("reconciliationStatus", payment.getReconciliationStatus().name());
        snapshot.put("reconciliationRemarks", payment.getReconciliationRemarks());
        snapshot.put("refundStatus", payment.getRefundStatus().name());
        snapshot.put("refundAmount", payment.getRefundAmount());
        return snapshot;
    }

    private User currentUser() {
        User user = currentUserOrNull();
        if (user == null) {
            throw new NotFoundException("Authenticated user not found");
        }
        return user;
    }

    private User currentUserOrNull() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() != null ? SecurityContextHolder.getContext().getAuthentication().getPrincipal() : null;
        if (principal instanceof AuthenticatedUser authenticatedUser) {
            return authenticatedUser.getUser();
        }
        return null;
    }
}











