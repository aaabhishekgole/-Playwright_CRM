package com.gadgetseva.config;

import com.gadgetseva.dto.AssignDeliveryRequest;
import com.gadgetseva.dto.AssignPickupRequest;
import com.gadgetseva.dto.CreateEstimateRequest;
import com.gadgetseva.dto.CreateInvoiceRequest;
import com.gadgetseva.dto.CreateServiceRequestRequest;
import com.gadgetseva.dto.CustomerPayload;
import com.gadgetseva.dto.RecordPaymentRequest;
import com.gadgetseva.dto.ReconcilePaymentRequest;
import com.gadgetseva.dto.ServiceRequestResponse;
import com.gadgetseva.dto.StatusTransitionRequest;
import com.gadgetseva.entity.Attachment;
import com.gadgetseva.entity.DeviceCategory;
import com.gadgetseva.entity.PaymentReconciliationStatus;
import com.gadgetseva.entity.RequestPriority;
import com.gadgetseva.entity.RequestStatus;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.entity.StatusHistory;
import com.gadgetseva.entity.Tenant;
import com.gadgetseva.entity.User;
import com.gadgetseva.persistence.AttachmentStore;
import com.gadgetseva.persistence.ServiceRequestStore;
import com.gadgetseva.persistence.StatusHistoryStore;
import com.gadgetseva.persistence.UserStore;
import com.gadgetseva.security.AuthenticatedUser;
import com.gadgetseva.service.ServiceRequestService;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

@Configuration
@Profile("local")
public class LocalWorkflowDataSeeder {

    private static final List<String> PICKUP_EVIDENCE_TYPES = List.of(
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

    private static final List<String> CASHLESS_DEVICE_EVIDENCE_TYPES = List.of(
            "CASHLESS_DEVICE_IMAGE_FRONT",
            "CASHLESS_DEVICE_IMAGE_BACK",
            "CASHLESS_DEVICE_IMAGE_LEFT",
            "CASHLESS_DEVICE_IMAGE_RIGHT",
            "CASHLESS_DEVICE_IMAGE_TOP",
            "CASHLESS_DEVICE_IMAGE_BOTTOM"
    );

    private static final List<String> CASHLESS_DAMAGE_EVIDENCE_TYPES = List.of(
            "CASHLESS_DAMAGE_IMAGE_1",
            "CASHLESS_DAMAGE_IMAGE_2",
            "CASHLESS_DAMAGE_IMAGE_3",
            "CASHLESS_DAMAGE_IMAGE_4"
    );

    private final ServiceRequestService serviceRequestService;
    private final ServiceRequestStore serviceRequestStore;
    private final UserStore userStore;
    private final StatusHistoryStore statusHistoryStore;
    private final AttachmentStore attachmentStore;
    private final Path storageRootPath;

    public LocalWorkflowDataSeeder(ServiceRequestService serviceRequestService,
                                   ServiceRequestStore serviceRequestStore,
                                   UserStore userStore,
                                   StatusHistoryStore statusHistoryStore,
                                   AttachmentStore attachmentStore,
                                   @Value("${app.storage.root-path:uploads}") String storageRootPath) {
        this.serviceRequestService = serviceRequestService;
        this.serviceRequestStore = serviceRequestStore;
        this.userStore = userStore;
        this.statusHistoryStore = statusHistoryStore;
        this.attachmentStore = attachmentStore;
        this.storageRootPath = Path.of(storageRootPath);
    }

    @Bean
    @Order(2)
    CommandLineRunner seedLocalWorkflowData() {
        return args -> {
            User admin = userStore.findByUsername("admin").orElse(null);
            User pickupAgent = userStore.findByUsername("pickup").orElse(null);
            User deliveryAgent = userStore.findByUsername("delivery").orElse(null);

            if (admin == null || pickupAgent == null || deliveryAgent == null) {
                return;
            }

            runAs(admin, () -> {
                seedScenario("DEMO-WORKSPACE-ASSIGN-PICKUP", request -> request.getStatus() == RequestStatus.REQUEST_CREATED, DeviceCategory.MOBILE, "Aarav Shah", "Mumbai", "Central", "Samsung", "Galaxy A54", "Display replacement required", request -> {
                });

                seedScenario("DEMO-WORKSPACE-PENDING-PICKUP", request -> request.getStatus() == RequestStatus.PICKUP_ASSIGNED || request.getStatus() == RequestStatus.PICKUP_IN_PROGRESS, DeviceCategory.TV, "Mira Patel", "Thane", "Harbour", "Sony", "Bravia X74K", "Power board diagnosis required", request -> {
                    assignPickup(request.id(), pickupAgent.getId(), "Runner assigned for doorstep pickup.");
                    addRemark(request.id(), "Pickup failed once because the customer requested a reschedule window.", pickupAgent);
                });

                seedScenario("DEMO-WORKSPACE-PICKUP-COMPLETE", request -> request.getStatus() == RequestStatus.PICKUP_COMPLETED, DeviceCategory.LAPTOP, "Ishaan Verma", "Pune", "Western", "HP", "Pavilion 14", "Keyboard and hinge inspection", request -> {
                    advanceToPickupCompleted(request.id(), pickupAgent);
                });

                seedScenario("DEMO-WORKSPACE-HUB-RECEIVED", request -> request.getStatus() == RequestStatus.RECEIVED_AT_HUB, DeviceCategory.AC, "Diya Nair", "Navi Mumbai", "South Mumbai", "LG", "Dual Inverter AC", "Cooling issue and PCB check", request -> {
                    advanceToReceivedAtHub(request.id(), pickupAgent);
                });

                seedScenario("DEMO-WORKSPACE-DIAGNOSIS", request -> request.getStatus() == RequestStatus.DIAGNOSIS_IN_PROGRESS, DeviceCategory.CAMERA_DSLR, "Kabir Sinha", "Mumbai", "Central", "Canon", "EOS 1500D", "Shutter mechanism inspection", request -> {
                    advanceToDiagnosis(request.id(), pickupAgent);
                });

                seedScenario("DEMO-WORKSPACE-ESTIMATE", request -> request.getStatus() == RequestStatus.ESTIMATE_PREPARED, DeviceCategory.MOBILE, "Anaya Gupta", "Mumbai", "Harbour", "OnePlus", "Nord CE", "Front glass and frame replacement", request -> {
                    advanceToEstimatePrepared(request.id(), pickupAgent, "Estimate prepared for screen and chassis restoration");
                });

                seedScenario("DEMO-WORKSPACE-CASHLESS", request -> request.getStatus() == RequestStatus.CASHLESS_APPROVED, DeviceCategory.LAPTOP, "Reyansh Kulkarni", "Pune", "Western", "Dell", "Inspiron 15", "Accidental damage claim", request -> {
                    advanceToEstimatePrepared(request.id(), pickupAgent, "Cashless estimate prepared for accidental damage");
                    addEvidence(request.id(), CASHLESS_DEVICE_EVIDENCE_TYPES, admin, "cashless-device");
                    addEvidence(request.id(), CASHLESS_DAMAGE_EVIDENCE_TYPES, admin, "cashless-damage");
                    move(request.id(), RequestStatus.CASHLESS_PENDING_APPROVAL, "Cashless evidence uploaded and sent for approval");
                    serviceRequestService.approveEstimate(request.id(), "Cashless approval granted by backend team");
                });

                seedScenario("DEMO-WORKSPACE-REWORK", request -> request.getStatus() == RequestStatus.REPAIR_IN_PROGRESS, DeviceCategory.TV, "Siya Joshi", "Mumbai", "South Mumbai", "Samsung", "Crystal UHD", "Panel flicker and board rework", request -> {
                    advanceToRepairInProgress(request.id(), pickupAgent, "Repair estimate approved for panel rework");
                    addRemark(request.id(), "QC failed and device returned for rework after panel flicker reappeared.", admin);
                });

                seedScenario("DEMO-WORKSPACE-REPAIR-COMPLETE", request -> request.getStatus() == RequestStatus.REPAIR_COMPLETED, DeviceCategory.AC, "Vivaan Rao", "Thane", "Central", "Daikin", "Split Inverter", "Compressor and gas refill estimate", request -> {
                    advanceToRepairCompleted(request.id(), pickupAgent, "Repair completed after compressor replacement");
                });

                seedScenario("DEMO-WORKSPACE-DELIVERY-FAILED", request -> request.getStatus() == RequestStatus.DELIVERY_ASSIGNED, DeviceCategory.CAMERA_DSLR, "Sara Khan", "Mumbai", "Western", "Nikon", "D5600", "Lens mount repair", request -> {
                    advanceToDeliveryAssigned(request.id(), pickupAgent, deliveryAgent, "Repair completed and handed to delivery runner");
                    addRemark(request.id(), "Delivery failed because the customer was unavailable at the delivery location.", deliveryAgent);
                });

                seedScenario("DEMO-WORKSPACE-DELIVERED", request -> request.getStatus() == RequestStatus.DELIVERED, DeviceCategory.MOBILE, "Arjun Malhotra", "Mumbai", "Harbour", "Apple", "iPhone 13", "Battery and charging port replacement", request -> {
                    advanceToDelivered(request.id(), pickupAgent, deliveryAgent, "Delivered after repair completion");
                });

                seedScenario("DEMO-WORKSPACE-TOTAL-LOSS", request -> request.getStatus() == RequestStatus.TOTAL_LOSS, DeviceCategory.TV, "Priya Reddy", "Pune", "South Mumbai", "Xiaomi", "TV 5X", "Severe panel damage assessment", request -> {
                    advanceToEstimatePrepared(request.id(), pickupAgent, "Declared total loss after estimate review");
                    move(request.id(), RequestStatus.TOTAL_LOSS, "Declared total loss after estimate review");
                });

                seedScenario("DEMO-WORKSPACE-PENDING-INVOICE", request -> request.getStatus() == RequestStatus.INVOICED, DeviceCategory.LAPTOP, "Neel Kapoor", "Mumbai", "Central", "Lenovo", "ThinkPad E14", "Motherboard and SSD replacement", request -> {
                    advanceToDelivered(request.id(), pickupAgent, deliveryAgent, "Delivered and ready for billing");
                    serviceRequestService.createInvoice(request.id(), new CreateInvoiceRequest(null, "MH", "MH", new BigDecimal("18"), "Repair labour and diagnostics", "Spare parts and consumables"));
                });

                seedScenario("DEMO-WORKSPACE-PAID-INVOICE", request -> request.getStatus() == RequestStatus.CLOSED, DeviceCategory.AC, "Tara Bhat", "Navi Mumbai", "Western", "Voltas", "Inverter AC", "Indoor unit board and motor repair", request -> {
                    advanceToDelivered(request.id(), pickupAgent, deliveryAgent, "Delivered and closed for collections");
                    ServiceRequestResponse invoiced = serviceRequestService.createInvoice(request.id(), new CreateInvoiceRequest(null, "MH", "MH", new BigDecimal("18"), "Repair labour and diagnostics", "Spare parts and consumables"));
                    BigDecimal total = invoiced.invoice() != null ? invoiced.invoice().totalAmount() : BigDecimal.ZERO;
                    serviceRequestService.recordPayment(request.id(), new RecordPaymentRequest("UPI-DEMO-" + request.id(), total, "UPI", "UTR-DEMO-" + request.id(), "{\"source\":\"local-seeder\"}"));
                    ServiceRequestResponse paid = serviceRequestService.get(request.id());
                    if (!paid.payments().isEmpty()) {
                        serviceRequestService.reconcilePayment(request.id(), paid.payments().get(0).id(), new ReconcilePaymentRequest(PaymentReconciliationStatus.RECONCILED, "Auto reconciled for local workflow demo"));
                    }
                });

                backfillExpandedPickupEvidence(admin);
            });
        };
    }

    private void seedScenario(String partnerReference,
                              Predicate<ServiceRequest> visibilityRule,
                              DeviceCategory category,
                              String customerName,
                              String city,
                              String branchName,
                              String brand,
                              String model,
                              String issueSummary,
                              ScenarioSeeder scenarioSeeder) {
        List<ServiceRequest> matchingRequests = serviceRequestStore.findAllByPartnerReferenceStartingWithOrderByCreatedAtDesc(partnerReference);
        if (matchingRequests.stream().anyMatch(visibilityRule)) {
            return;
        }

        String effectivePartnerReference = nextPartnerReference(partnerReference, matchingRequests);
        String phoneSuffix = derivePhoneSuffix(effectivePartnerReference);

        ServiceRequestResponse created = serviceRequestService.create(new CreateServiceRequestRequest(
                new CustomerPayload(
                        customerName,
                        customerName,
                        effectivePartnerReference.toLowerCase() + "@gadgetseva.local",
                        null,
                        "9000" + phoneSuffix + "10",
                        "9000" + phoneSuffix + "20",
                        "9000" + phoneSuffix + "30",
                        branchName + " Service Road, " + city,
                        null,
                        "Near Gadget Seva " + branchName + " hub",
                        "https://maps.google.com/?q=" + branchName + "+" + city,
                        city,
                        "Maharashtra",
                        "400001"
                ),
                new com.gadgetseva.dto.DevicePayload(
                        brand,
                        model,
                        category,
                        "SER-" + effectivePartnerReference,
                        category == DeviceCategory.MOBILE ? "490154203237518" : null,
                        "IN_WARRANTY",
                        "Operational with reported fault",
                        null
                ),
                issueSummary,
                issueSummary + " captured from the local workflow seeder for submenu validation.",
                RequestPriority.HIGH,
                "WEB_PORTAL",
                "GSH-CORE",
                "LN-" + phoneSuffix,
                "COI-" + phoneSuffix,
                null,
                effectivePartnerReference,
                "Demo Workflow",
                branchName,
                "EMP-" + phoneSuffix,
                customerName,
                48
        ));

        scenarioSeeder.accept(created);
    }

    private String nextPartnerReference(String basePartnerReference, List<ServiceRequest> matchingRequests) {
        Set<String> existingReferences = matchingRequests.stream()
                .map(ServiceRequest::getPartnerReference)
                .collect(Collectors.toSet());

        if (!existingReferences.contains(basePartnerReference)) {
            return basePartnerReference;
        }

        int suffix = 2;
        String candidate = basePartnerReference + "-R" + suffix;
        while (existingReferences.contains(candidate)) {
            suffix++;
            candidate = basePartnerReference + "-R" + suffix;
        }
        return candidate;
    }

    private String derivePhoneSuffix(String partnerReference) {
        String digits = partnerReference.replaceAll("[^0-9]", "");
        if (digits.length() >= 4) {
            return digits.substring(digits.length() - 4);
        }
        return String.format("%04d", Math.abs(partnerReference.hashCode()) % 10000);
    }

    private void advanceToPickupCompleted(Long requestId, User pickupAgent) {
        assignPickup(requestId, pickupAgent.getId(), "Pickup scheduled from seeded assign board.");
        addEvidence(requestId, PICKUP_EVIDENCE_TYPES, pickupAgent, "pickup");
        move(requestId, RequestStatus.PICKUP_COMPLETED, "Pickup completed with 10 required device photos");
    }

    private void advanceToReceivedAtHub(Long requestId, User pickupAgent) {
        advanceToPickupCompleted(requestId, pickupAgent);
        move(requestId, RequestStatus.RECEIVED_AT_HUB, "Device inward completed at hub");
    }

    private void advanceToDiagnosis(Long requestId, User pickupAgent) {
        advanceToReceivedAtHub(requestId, pickupAgent);
        move(requestId, RequestStatus.DIAGNOSIS_IN_PROGRESS, "Sent to service center for estimation");
    }

    private void advanceToEstimatePrepared(Long requestId, User pickupAgent, String diagnosisSummary) {
        advanceToDiagnosis(requestId, pickupAgent);
        serviceRequestService.createEstimate(requestId, new CreateEstimateRequest(
                diagnosisSummary,
                new BigDecimal("2400.00"),
                new BigDecimal("900.00"),
                new BigDecimal("594.00")
        ));
    }

    private void advanceToRepairInProgress(Long requestId, User pickupAgent, String approvalRemarks) {
        advanceToEstimatePrepared(requestId, pickupAgent, approvalRemarks);
        serviceRequestService.approveEstimate(requestId, approvalRemarks);
        move(requestId, RequestStatus.REPAIR_IN_PROGRESS, "Repair started after estimate approval");
    }

    private void advanceToRepairCompleted(Long requestId, User pickupAgent, String completionRemarks) {
        advanceToRepairInProgress(requestId, pickupAgent, completionRemarks);
        move(requestId, RequestStatus.REPAIR_COMPLETED, completionRemarks);
    }

    private void advanceToDeliveryAssigned(Long requestId, User pickupAgent, User deliveryAgent, String remarks) {
        advanceToRepairCompleted(requestId, pickupAgent, "Repair completed and queued for dispatch");
        move(requestId, RequestStatus.READY_FOR_DISPATCH, "Device ready for dispatch after QC");
        serviceRequestService.assignDelivery(requestId, new AssignDeliveryRequest(
                deliveryAgent.getId(),
                Instant.now().plusSeconds(172800),
                "9032",
                remarks
        ));
    }

    private void advanceToDelivered(Long requestId, User pickupAgent, User deliveryAgent, String remarks) {
        advanceToDeliveryAssigned(requestId, pickupAgent, deliveryAgent, remarks);
        move(requestId, RequestStatus.OUT_FOR_DELIVERY, "Device handed to delivery runner");
        move(requestId, RequestStatus.DELIVERED, remarks);
    }

    private void assignPickup(Long requestId, Long agentId, String notes) {
        serviceRequestService.assignPickup(requestId, new AssignPickupRequest(
                agentId,
                Instant.now().plusSeconds(86400),
                "4826",
                notes
        ));
    }

    private void move(Long requestId, RequestStatus targetStatus, String remarks) {
        serviceRequestService.transitionStatus(requestId, new StatusTransitionRequest(targetStatus, remarks));
    }

    private void addRemark(Long requestId, String remarks, User changedBy) {
        ServiceRequest request = serviceRequestStore.findById(requestId).orElseThrow();
        StatusHistory history = new StatusHistory();
        history.setServiceRequest(request);
        history.setFromStatus(request.getStatus().name());
        history.setToStatus(request.getStatus().name());
        history.setRemarks(remarks);
        history.setChangedBy(changedBy);
        history.setChangedAt(Instant.now());
        statusHistoryStore.save(history);
    }

    private void addEvidence(Long requestId, List<String> attachmentTypes, User uploadedBy, String labelPrefix) {
        ServiceRequest request = serviceRequestStore.findById(requestId).orElseThrow();
        Tenant tenant = request.getTenant();

        for (String attachmentType : attachmentTypes) {
            if (attachmentStore.existsByServiceRequestAndAttachmentType(request, attachmentType)) {
                continue;
            }

            String fileName = labelPrefix + "-" + attachmentType.toLowerCase() + ".svg";
            String objectKey = request.getId() + "/" + fileName;
            byte[] content = buildSvgBytes(request.getRequestNumber(), attachmentType);
            Path target = storageRootPath.resolve(objectKey).normalize();

            try {
                Files.createDirectories(target.getParent());
                Files.write(target, content);
            } catch (Exception exception) {
                throw new IllegalStateException("Unable to create seeded attachment file " + objectKey, exception);
            }

            Attachment attachment = new Attachment();
            attachment.setServiceRequest(request);
            attachment.setTenant(tenant);
            attachment.setAttachmentType(attachmentType);
            attachment.setFileName(fileName);
            attachment.setContentType("image/svg+xml");
            attachment.setObjectKey(objectKey);
            attachment.setChecksum(checksum(content));
            attachment.setPrivateFile(true);
            attachment.setSignedUrlExpiresAt(Instant.now().plusSeconds(900));
            attachment.setUploadedBy(uploadedBy);
            attachment.setUploadedAt(Instant.now());
            attachmentStore.save(attachment);
        }
    }

    private void backfillExpandedPickupEvidence(User uploadedBy) {
        serviceRequestStore.findAllOrderByCreatedAtDesc().stream()
                .filter(request -> request.getPartnerReference() != null && request.getPartnerReference().startsWith("DEMO-WORKSPACE-"))
                .filter(request -> request.getStatus() == RequestStatus.PICKUP_COMPLETED
                        || request.getStatus() == RequestStatus.RECEIVED_AT_HUB
                        || request.getStatus() == RequestStatus.DIAGNOSIS_IN_PROGRESS
                        || request.getStatus() == RequestStatus.ESTIMATE_PREPARED
                        || request.getStatus() == RequestStatus.CASHLESS_PENDING_APPROVAL
                        || request.getStatus() == RequestStatus.CASHLESS_APPROVED
                        || request.getStatus() == RequestStatus.ESTIMATE_APPROVED
                        || request.getStatus() == RequestStatus.REPAIR_IN_PROGRESS
                        || request.getStatus() == RequestStatus.REPAIR_COMPLETED
                        || request.getStatus() == RequestStatus.TOTAL_LOSS
                        || request.getStatus() == RequestStatus.READY_FOR_DISPATCH
                        || request.getStatus() == RequestStatus.DELIVERY_ASSIGNED
                        || request.getStatus() == RequestStatus.OUT_FOR_DELIVERY
                        || request.getStatus() == RequestStatus.DELIVERED
                        || request.getStatus() == RequestStatus.INVOICED
                        || request.getStatus() == RequestStatus.CLOSED)
                .forEach(request -> addEvidence(request.getId(), PICKUP_EVIDENCE_TYPES, uploadedBy, "pickup"));
    }

    private byte[] buildSvgBytes(String requestNumber, String attachmentType) {
        String svg = """
                <svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
                  <rect width="640" height="480" fill="#eff6ff"/>
                  <rect x="22" y="22" width="596" height="436" rx="24" fill="#dbeafe" stroke="#2563eb" stroke-width="4"/>
                  <text x="48" y="120" font-size="34" fill="#1e3a8a" font-family="Segoe UI, Arial, sans-serif">Gadget Seva Hub Demo Evidence</text>
                  <text x="48" y="190" font-size="28" fill="#0f172a" font-family="Segoe UI, Arial, sans-serif">%s</text>
                  <text x="48" y="250" font-size="24" fill="#334155" font-family="Segoe UI, Arial, sans-serif">%s</text>
                </svg>
                """.formatted(requestNumber, attachmentType.replace('_', ' '));
        return svg.getBytes(StandardCharsets.UTF_8);
    }

    private String checksum(byte[] content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(content));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to checksum seeded attachment", exception);
        }
    }

    private void runAs(User user, Runnable action) {
        SecurityContext previous = SecurityContextHolder.getContext();
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        AuthenticatedUser principal = new AuthenticatedUser(user);
        context.setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        SecurityContextHolder.setContext(context);
        try {
            action.run();
        } finally {
            SecurityContextHolder.setContext(previous);
        }
    }

    @FunctionalInterface
    private interface ScenarioSeeder {
        void accept(ServiceRequestResponse request);
    }
}
