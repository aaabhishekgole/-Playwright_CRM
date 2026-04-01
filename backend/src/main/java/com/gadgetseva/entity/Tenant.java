package com.gadgetseva.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Setter;

@Getter
@Setter
@Entity
@Document(collection = "tenants")
@Table(name = "tenants")
public class Tenant extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 30)
    private String partnerType;

    @Column(length = 20)
    private String gstin;

    @Column(nullable = false)
    private Integer defaultSlaHours = 48;

    @Column(nullable = false)
    private boolean active = true;
}