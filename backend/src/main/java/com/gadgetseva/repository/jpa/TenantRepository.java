package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.Tenant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Optional<Tenant> findByCode(String code);
}
