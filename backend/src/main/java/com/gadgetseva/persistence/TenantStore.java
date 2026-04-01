package com.gadgetseva.persistence;

import com.gadgetseva.entity.Tenant;
import java.util.Optional;

public interface TenantStore {

    Optional<Tenant> findByCode(String code);

    Tenant save(Tenant tenant);
}
