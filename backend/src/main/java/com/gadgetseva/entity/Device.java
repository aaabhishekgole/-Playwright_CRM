package com.gadgetseva.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "devices")
public class Device extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String brand;

    @Column(nullable = false, length = 80)
    private String model;

    @Column(nullable = false, unique = true, length = 120)
    private String serialNumber;

    @Column(length = 50)
    private String imeiNumber;

    @Column(nullable = false, length = 30)
    private String warrantyStatus;

    @Column(length = 120)
    private String deviceCondition;

    @Column(columnDefinition = "TEXT")
    private String qrCodePayload;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ImeiValidationStatus imeiValidationStatus = ImeiValidationStatus.NOT_PROVIDED;
}