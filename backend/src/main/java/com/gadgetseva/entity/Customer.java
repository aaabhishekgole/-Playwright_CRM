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
import lombok.Getter;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Setter;

@Getter
@Setter
@Entity
@Document(collection = "customers")
@Table(name = "customers")
public class Customer extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String fullName;

    @Column(length = 120)
    private String email;

    @Column(length = 120)
    private String secondaryEmail;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 20)
    private String alternatePhone;

    @Column(length = 20)
    private String whatsappNumber;

    @Column(length = 120)
    private String contactPerson;

    @Column(nullable = false, length = 180)
    private String addressLine1;

    @Column(length = 180)
    private String addressLine2;

    @Column(length = 180)
    private String landmark;

    @Column(length = 255)
    private String googleMapLink;

    @Column(nullable = false, length = 80)
    private String city;

    @Column(nullable = false, length = 80)
    private String state;

    @Column(nullable = false, length = 20)
    private String postalCode;

    @Column(length = 20)
    private String gstin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    @DBRef(lazy = true)
    private Tenant tenant;
}
