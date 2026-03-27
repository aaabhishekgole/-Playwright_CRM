package com.gadgetseva.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "service_requests")
public class ServiceRequest extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String requestNumber;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id")
    private Device device;

    @Column(nullable = false, length = 255)
    private String issueSummary;

    @Column(columnDefinition = "TEXT")
    private String issueDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequestPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private RequestStatus status;

    @Column(nullable = false, length = 40)
    private String sourceChannel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_pickup_agent_id")
    private User assignedPickupAgent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_technician_id")
    private User assignedTechnician;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_delivery_agent_id")
    private User assignedDeliveryAgent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(length = 60)
    private String loanNumber;

    @Column(length = 80)
    private String certificateOfInsuranceNumber;

    @Column(length = 60)
    private String previousTicketNumber;

    @Column(length = 60)
    private String partnerReference;

    @Column(length = 120)
    private String projectName;

    @Column(length = 120)
    private String branchName;

    @Column(length = 80)
    private String employeeCode;

    @Column(length = 120)
    private String employeeName;

    @Column(nullable = false)
    private Instant committedAt;

    @Column(nullable = false)
    private Instant expectedCompletionAt;

    @Column(nullable = false)
    private Instant slaDeadlineAt;

    private Instant actualResolutionAt;

    private Long tatMinutes;

    @Column(nullable = false)
    private boolean slaBreached;

    private Instant lastSlaAlertAt;

    @Column(length = 255)
    private String breachReason;
}
