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
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Setter;

@Getter
@Setter
@Entity
@Document(collection = "estimates")
@Table(name = "estimates")
public class Estimate extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "service_request_id")
    @DBRef(lazy = true)
    private ServiceRequest serviceRequest;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String diagnosisSummary;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal partsCost;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal laborCost;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private boolean approved;

    private Instant approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    @DBRef(lazy = true)
    private User approvedBy;
}
