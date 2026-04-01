package com.gadgetseva.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Setter;

@Getter
@Setter
@Entity
@Document(collection = "pickups")
@Table(name = "pickups")
public class Pickup extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "service_request_id")
    @DBRef(lazy = true)
    private ServiceRequest serviceRequest;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    @DBRef(lazy = true)
    private User agent;

    @Column(nullable = false)
    private Instant scheduledAt;

    @Column(length = 10)
    private String pickupOtp;

    private Instant acceptedAt;

    private Instant completedAt;

    @Column(length = 120, unique = true)
    private String runnerPortalToken;

    private Instant runnerLinkSentAt;

    @Column(nullable = false)
    private boolean customerConfirmation;

    @Column(length = 255)
    private String notes;
}
