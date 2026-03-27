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
import com.gadgetseva.entity.RequestStatus;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.entity.StatusHistory;
import com.gadgetseva.entity.Tenant;
import com.gadgetseva.entity.User;
import com.gadgetseva.exception.ApiException;
import com.gadgetseva.exception.NotFoundException;
import com.gadgetseva.mapper.ServiceRequestMapper;
import com.gadgetseva.repository.AttachmentRepository;
import com.gadgetseva.repository.CustomerRepository;
import com.gadgetseva.repository.DeliveryRepository;
import com.gadgetseva.repository.DeviceRepository;
import com.gadgetseva.repository.EstimateRepository;
import com.gadgetseva.repository.InvoiceLineItemRepository;
import com.gadgetseva.repository.InvoiceRepository;
import com.gadgetseva.repository.PaymentTransactionRepository;
import com.gadgetseva.repository.PickupRepository;
import com.gadgetseva.repository.ServiceRequestRepository;
import com.gadgetseva.repository.StatusHistoryRepository;
import com.gadgetseva.repository.TenantRepository;
import com.gadgetseva.repository.UserRepository;
import com.gadgetseva.security.AuthenticatedUser;
import com.gadgetseva.util.ImeiTools;
import com.gadgetseva.util.RequestNumberGenerator;
import com.gadgetseva.util.StatusTransitionRules;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    private final ServiceRequestRepository serviceRequestRepository;
    private final CustomerRepository customerRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final PickupRepository pickupRepository;
    private final EstimateRepository estimateRepository;
    private final DeliveryRepository deliveryRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final AttachmentRepository attachmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceLineItemRepository invoiceLineItemRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final TenantRepository tenantRepository;
    private final ServiceRequestMapper mapper;
    private final RequestNumberGenerator requestNumberGenerator;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final AuditTrailService auditTrailService;
    private final String repairCenterStateCode;

    public ServiceRequestService(ServiceRequestRepository serviceRequestRepository,
                                 CustomerRepository customerRepository,
                                 DeviceRepository deviceRepository,
                                 UserRepository userRepository,
                                 PickupRepository pickupRepository,
                                 EstimateRepository estimateRepository,
                                 DeliveryRepository deliveryRepository,
                                 StatusHistoryRepository statusHistoryRepository,
                                 AttachmentRepository attachmentRepository,
                                 InvoiceRepository invoiceRepository,
                                 InvoiceLineItemRepository invoiceLineItemRepository,
                                 PaymentTransactionRepository paymentTransactionRepository,
                                 TenantRepository tenantRepository,
                                 ServiceRequestMapper mapper,
                                 RequestNumberGenerator requestNumberGenerator,
                                 FileStorageService fileStorageService,
                                 NotificationService notificationService,
                                 AuditTrailService auditTrailService,
                                 @Value("${app.repair-center-state-code}") String repairCenterStateCode) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.customerRepository = customerRepository;
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
        this.pickupRepository = pickupRepository;
        this.estimateRepository = estimateRepository;
        this.deliveryRepository = deliveryRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.attachmentRepository = attachmentRepository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceLineItemRepository = invoiceLineItemRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.tenantRepository = tenantRepository;
        this.mapper = mapper;
        this.requestNumberGenerator = requestNumberGenerator;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
        this.auditTrailService = auditTrailService;
        this.repairCenterStateCode = repairCenterStateCode;
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
        customerRepository.save(customer);

        Device device = buildValidatedDevice(request);
        deviceRepository.save(device);

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
        serviceRequestRepository.save(serviceRequest);

        Map<String, Object> after = requestSnapshot(serviceRequest);
        recordHistory(serviceRequest, null, RequestStatus.REQUEST_CREATED, "Service request created", null, after);
        auditTrailService.logChange("ServiceRequest", serviceRequest.getId(), serviceRequest.getId(), "CREATE", null, after, currentUserOrNull());
        notificationService.queueStatusUpdate(serviceRequest, "Request Created", "Your request " + serviceRequest.getRequestNumber() + " has been created.");
        return buildResponse(serviceRequest);
    }

    public List<ServiceRequestResponse> list(RequestStatus status) {
        List<ServiceRequest> requests = status == null
                ? serviceRequestRepository.findAllByOrderByCreatedAtDesc()
                : serviceRequestRepository.findByStatusOrderByCreatedAtDesc(status);
        return requests.stream().map(this::buildResponse).toList();
    }

    public ServiceRequestResponse get(Long id) {
        return buildResponse(findRequest(id));
    }

    public ServiceRequestResponse assignPickup(Long requestId, AssignPickupRequest request) {
        ServiceRequest serviceRequest = findRequest(requestId);
        User agent = findUser(request.agentId());
        Pickup pickup = pickupRepository.findByServiceRequest(serviceRequest).orElseGet(Pickup::new);
        Map<String, Object> before = pickupSnapshot(pickup);
        pickup.setServiceRequest(serviceRequest);
        pickup.setAgent(agent);
        pickup.setScheduledAt(request.scheduledAt());
        pickup.setPickupOtp(request.pickupOtp());
        pickup.setNotes(request.notes());
        pickupRepository.save(pickup);
        serviceRequest.setAssignedPickupAgent(agent);
        transition(serviceRequest, RequestStatus.PICKUP_ASSIGNED, "Pickup assigned");
        auditTrailService.logChange("Pickup", pickup.getId(), serviceRequest.getId(), "UPSERT", before, pickupSnapshot(pickup), currentUserOrNull());
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse createEstimate(Long requestId, CreateEstimateRequest request) {
        ServiceRequest serviceRequest = findRequest(requestId);
        BigDecimal total = request.partsCost().add(request.laborCost()).add(request.taxAmount());
        Estimate estimate = estimateRepository.findByServiceRequest(serviceRequest).orElseGet(Estimate::new);
        Map<String, Object> before = estimateSnapshot(estimate);
        estimate.setServiceRequest(serviceRequest);
        estimate.setDiagnosisSummary(request.diagnosisSummary());
        estimate.setPartsCost(request.partsCost());
        estimate.setLaborCost(request.laborCost());
        estimate.setTaxAmount(request.taxAmount());
        estimate.setTotalAmount(total);
        estimateRepository.save(estimate);
        transition(serviceRequest, RequestStatus.ESTIMATE_PREPARED, "Estimate prepared");
        auditTrailService.logChange("Estimate", estimate.getId(), serviceRequest.getId(), "UPSERT", before, estimateSnapshot(estimate), currentUserOrNull());
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse approveEstimate(Long requestId, String remarks) {
        ServiceRequest serviceRequest = findRequest(requestId);
        Estimate estimate = estimateRepository.findByServiceRequest(serviceRequest)
                .orElseThrow(() -> new NotFoundException("Estimate not found for request " + requestId));
        Map<String, Object> before = estimateSnapshot(estimate);
        estimate.setApproved(true);
        estimate.setApprovedAt(Instant.now());
        estimate.setApprovedBy(currentUser());
        estimateRepository.save(estimate);
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
        Delivery delivery = deliveryRepository.findByServiceRequest(serviceRequest).orElseGet(Delivery::new);
        Map<String, Object> before = deliverySnapshot(delivery);
        delivery.setServiceRequest(serviceRequest);
        delivery.setAgent(agent);
        delivery.setScheduledAt(request.scheduledAt());
        delivery.setOtpCode(request.otpCode());
        delivery.setNotes(request.notes());
        deliveryRepository.save(delivery);
        serviceRequest.setAssignedDeliveryAgent(agent);
        transition(serviceRequest, RequestStatus.DELIVERY_ASSIGNED, "Delivery assigned");
        auditTrailService.logChange("Delivery", delivery.getId(), serviceRequest.getId(), "UPSERT", before, deliverySnapshot(delivery), currentUserOrNull());
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse uploadAttachment(Long requestId, String attachmentType, MultipartFile file) {
        ServiceRequest serviceRequest = findRequest(requestId);
        validateAttachmentUpload(serviceRequest, attachmentType);
        StoredFileDescriptor storedFile = fileStorageService.store(requestId, file);
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
        attachment.setUploadedBy(currentUserOrNull());
        attachment.setUploadedAt(Instant.now());
        attachmentRepository.save(attachment);
        maybeAdvanceEvidenceWorkflow(serviceRequest);
        auditTrailService.logChange("Attachment", attachment.getId(), serviceRequest.getId(), "UPLOAD", null, attachmentSnapshot(attachment), currentUserOrNull());
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse deleteAttachment(Long requestId, Long attachmentId) {
        ServiceRequest serviceRequest = findRequest(requestId);
        Attachment attachment = attachmentRepository.findByIdAndServiceRequest(attachmentId, serviceRequest)
                .orElseThrow(() -> new NotFoundException("Attachment not found: " + attachmentId));
        if (serviceRequest.getStatus() == RequestStatus.CASHLESS_APPROVED && attachment.getAttachmentType().startsWith("CASHLESS_")) {
            throw new ApiException("Approved cashless evidence cannot be removed");
        }

        Map<String, Object> before = attachmentSnapshot(attachment);
        fileStorageService.delete(attachment.getObjectKey());
        attachmentRepository.delete(attachment);

        if (serviceRequest.getStatus() == RequestStatus.CASHLESS_PENDING_APPROVAL && attachment.getAttachmentType().startsWith("CASHLESS_") && !hasCompleteCashlessEvidence(serviceRequest)) {
            transition(serviceRequest, RequestStatus.CASHLESS_REVISION_REQUIRED, "Cashless evidence removed and requires revision");
        }

        auditTrailService.logChange("Attachment", attachmentId, serviceRequest.getId(), "DELETE", before, null, currentUserOrNull());
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse createInvoice(Long requestId, CreateInvoiceRequest request) {
        ServiceRequest serviceRequest = findRequest(requestId);
        Estimate estimate = estimateRepository.findByServiceRequest(serviceRequest)
                .orElseThrow(() -> new NotFoundException("Estimate not found for request " + requestId));
        if (invoiceRepository.findByServiceRequest(serviceRequest).isPresent()) {
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
        invoiceRepository.save(invoice);
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
        Invoice invoice = invoiceRepository.findByServiceRequest(serviceRequest)
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
        paymentTransactionRepository.save(payment);

        invoice.setAmountPaid(invoice.getAmountPaid().add(request.amount()));
        invoice.setAmountDue(invoice.getTotalAmount().subtract(invoice.getAmountPaid()).max(BigDecimal.ZERO));
        invoice.setPaymentStatus(invoice.getAmountDue().compareTo(BigDecimal.ZERO) == 0 ? PaymentStatus.CAPTURED.name() : "PARTIAL");
        if (invoice.getAmountDue().compareTo(BigDecimal.ZERO) == 0) {
            invoice.setPaidAt(Instant.now());
        }
        invoiceRepository.save(invoice);
        auditTrailService.logChange("Payment", payment.getId(), serviceRequest.getId(), "CAPTURE", null, paymentSnapshot(payment), currentUserOrNull());
        notificationService.queueStatusUpdate(serviceRequest, "Payment Recorded", "Payment received against invoice " + invoice.getInvoiceNumber());
        return buildResponse(serviceRequest);
    }

    public ServiceRequestResponse reconcilePayment(Long requestId, Long paymentId, com.gadgetseva.dto.ReconcilePaymentRequest request) {
        ServiceRequest serviceRequest = findRequest(requestId);
        PaymentTransaction payment = paymentTransactionRepository.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("Payment not found: " + paymentId));
        if (!payment.getServiceRequest().getId().equals(serviceRequest.getId())) {
            throw new ApiException("Payment does not belong to request " + requestId);
        }
        payment.setReconciliationStatus(request.reconciliationStatus());
        payment.setReconciliationRemarks(request.remarks());
        payment.setReconciledAt(Instant.now());
        paymentTransactionRepository.save(payment);
        auditTrailService.logChange("Payment", payment.getId(), serviceRequest.getId(), "RECONCILE", null, paymentSnapshot(payment), currentUserOrNull());
        notificationService.queueStatusUpdate(serviceRequest, "Payment Reconciled", "Payment " + payment.getPaymentReference() + " was marked as " + request.reconciliationStatus().name());
        return buildResponse(serviceRequest);
    }
    public ServiceRequestResponse refundPayment(Long requestId, RefundPaymentRequest request) {
        ServiceRequest serviceRequest = findRequest(requestId);
        PaymentTransaction payment = paymentTransactionRepository.findById(request.paymentId())
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
        paymentTransactionRepository.save(payment);

        invoice.setRefundAmount(invoice.getRefundAmount().add(request.amount()));
        invoice.setAmountPaid(invoice.getAmountPaid().subtract(request.amount()).max(BigDecimal.ZERO));
        invoice.setAmountDue(invoice.getTotalAmount().subtract(invoice.getAmountPaid()).max(BigDecimal.ZERO));
        invoice.setPaymentStatus(payment.getPaymentStatus().name());
        invoiceRepository.save(invoice);
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
        List<ServiceRequest> overdue = serviceRequestRepository.findBySlaBreachedFalseAndStatusNotInAndSlaDeadlineAtBefore(List.of(RequestStatus.CLOSED), Instant.now());
        for (ServiceRequest serviceRequest : overdue) {
            serviceRequest.setSlaBreached(true);
            serviceRequest.setBreachReason("SLA breached at " + Instant.now());
            serviceRequest.setLastSlaAlertAt(Instant.now());
            serviceRequestRepository.save(serviceRequest);
            auditTrailService.logChange("ServiceRequest", serviceRequest.getId(), serviceRequest.getId(), "SLA_BREACH", null, requestSnapshot(serviceRequest), null);
            notificationService.queueAlert(serviceRequest, "ops@" + serviceRequest.getTenant().getCode().toLowerCase() + ".local", "SLA Breach Alert", "Request " + serviceRequest.getRequestNumber() + " has breached its SLA.");
        }
    }

    private Device buildValidatedDevice(CreateServiceRequestRequest request) {
        Device device = deviceRepository.findBySerialNumber(request.device().serialNumber()).orElseGet(Device::new);
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
        invoiceLineItemRepository.save(labor);
        if (estimate.getPartsCost().compareTo(BigDecimal.ZERO) > 0) {
            InvoiceLineItem parts = new InvoiceLineItem();
            parts.setInvoice(invoice);
            parts.setDescription(request.partsDescription() != null && !request.partsDescription().isBlank() ? request.partsDescription() : "Spare parts and consumables");
            parts.setQuantity(1);
            parts.setUnitPrice(estimate.getPartsCost());
            parts.setTaxableValue(estimate.getPartsCost());
            parts.setGstRate(effectiveRate);
            parts.setLineTotal(estimate.getPartsCost());
            invoiceLineItemRepository.save(parts);
        }
    }

    private ServiceRequest findRequest(Long id) {
        return serviceRequestRepository.findById(id).orElseThrow(() -> new NotFoundException("Service request not found: " + id));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found: " + userId));
    }

    private Tenant resolveTenant(String tenantCode) {
        String effectiveCode = tenantCode != null && !tenantCode.isBlank() ? tenantCode : "GSH-CORE";
        return tenantRepository.findByCode(effectiveCode).orElseThrow(() -> new NotFoundException("Tenant not found: " + effectiveCode));
    }

    private void transition(ServiceRequest serviceRequest, RequestStatus targetStatus, String remarks) {
        Map<String, Object> before = requestSnapshot(serviceRequest);
        if (targetStatus == RequestStatus.PICKUP_COMPLETED) {
            long pickupPhotos = attachmentRepository.countByServiceRequestAndAttachmentTypeStartingWith(serviceRequest, "PICKUP_IMAGE_");
            if (pickupPhotos < 6) {
                throw new ApiException("Upload all 6 pickup images before marking pickup completed");
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
        serviceRequestRepository.save(serviceRequest);
        Map<String, Object> after = requestSnapshot(serviceRequest);
        recordHistory(serviceRequest, previous, targetStatus, remarks, before, after);
        auditTrailService.logChange("ServiceRequest", serviceRequest.getId(), serviceRequest.getId(), "STATUS_CHANGE", before, after, currentUserOrNull());
        notificationService.queueStatusUpdate(serviceRequest, "Request Update", "Request " + serviceRequest.getRequestNumber() + " moved to " + targetStatus);
    }

    private void recordHistory(ServiceRequest serviceRequest, RequestStatus previous, RequestStatus targetStatus, String remarks, Object before, Object after) {
        StatusHistory history = new StatusHistory();
        history.setServiceRequest(serviceRequest);
        history.setFromStatus(previous != null ? previous.name() : null);
        history.setToStatus(targetStatus.name());
        history.setRemarks(remarks);
        history.setChangedBy(currentUserOrNull());
        history.setChangedAt(Instant.now());
        history.setBeforeValueJson(auditTrailService.toJson(before));
        history.setAfterValueJson(auditTrailService.toJson(after));
        statusHistoryRepository.save(history);
    }

    private ServiceRequestResponse buildResponse(ServiceRequest serviceRequest) {
        List<StatusHistory> history = statusHistoryRepository.findByServiceRequestOrderByChangedAtAsc(serviceRequest);
        List<Attachment> attachments = attachmentRepository.findByServiceRequest(serviceRequest);
        Invoice invoice = invoiceRepository.findByServiceRequest(serviceRequest).orElse(null);
        List<InvoiceLineItem> invoiceItems = invoice != null ? invoiceLineItemRepository.findByInvoiceOrderByIdAsc(invoice) : List.of();
        List<PaymentTransaction> payments = paymentTransactionRepository.findByServiceRequestOrderByCreatedAtDesc(serviceRequest);
        List<NotificationLog> notifications = notificationService.listForRequest(serviceRequest.getId());
        return mapper.toResponse(serviceRequest, history, attachments, invoice, invoiceItems, payments, notifications, auditTrailService.listForRequest(serviceRequest.getId()));
    }
    private void validateAttachmentUpload(ServiceRequest serviceRequest, String attachmentType) {
        if (attachmentType == null || attachmentType.isBlank()) {
            throw new ApiException("Attachment type is required");
        }
        if (attachmentRepository.existsByServiceRequestAndAttachmentType(serviceRequest, attachmentType)) {
            throw new ApiException("Attachment already uploaded for type " + attachmentType);
        }
        enforceGroupedAttachmentLimit(serviceRequest, attachmentType, "PICKUP_IMAGE_", 6, "Pickup requires exactly 6 side images");
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
        long existing = attachmentRepository.countByServiceRequestAndAttachmentTypeStartingWith(serviceRequest, prefix);
        if (existing >= maxAllowed) {
            throw new ApiException(message);
        }
    }

    private void maybeAdvanceEvidenceWorkflow(ServiceRequest serviceRequest) {
        if ((serviceRequest.getStatus() == RequestStatus.ESTIMATE_PREPARED || serviceRequest.getStatus() == RequestStatus.CASHLESS_REVISION_REQUIRED)
                && hasCompleteCashlessEvidence(serviceRequest)) {
            transition(serviceRequest, RequestStatus.CASHLESS_PENDING_APPROVAL, "Cashless evidence set completed");
        }
    }

    private boolean hasCompleteCashlessEvidence(ServiceRequest serviceRequest) {
        long cashlessDevicePhotos = attachmentRepository.countByServiceRequestAndAttachmentTypeStartingWith(serviceRequest, "CASHLESS_DEVICE_IMAGE_");
        long cashlessDamagePhotos = attachmentRepository.countByServiceRequestAndAttachmentTypeStartingWith(serviceRequest, "CASHLESS_DAMAGE_IMAGE_");
        return cashlessDevicePhotos >= 6 && cashlessDamagePhotos >= 4;
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











