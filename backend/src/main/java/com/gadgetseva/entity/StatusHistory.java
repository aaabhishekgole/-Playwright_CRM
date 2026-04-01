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
@Document(collection = "status_history")
@Table(name = "status_history")
public class StatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "service_request_id")
    @DBRef(lazy = true)
    private ServiceRequest serviceRequest;

    @Column(length = 40)
    private String fromStatus;

    @Column(nullable = false, length = 40)
    private String toStatus;

    @Column(length = 255)
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    @DBRef(lazy = true)
    private User changedBy;

    @Column(nullable = false)
    private Instant changedAt;

    @Column(columnDefinition = "TEXT")
    private String beforeValueJson;

    @Column(columnDefinition = "TEXT")
    private String afterValueJson;
}