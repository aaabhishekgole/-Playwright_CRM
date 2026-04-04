package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.Tenant;
import com.gadgetseva.persistence.TenantStore;
import com.gadgetseva.repository.jpa.TenantRepository;
import java.util.Optional;
import com.gadgetseva.persistence.JpaPersistenceAdapter;

@JpaPersistenceAdapter
public class JpaTenantStore implements TenantStore {

    private final TenantRepository tenantRepository;

    public JpaTenantStore(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Override
    public Optional<Tenant> findByCode(String code) {
        return tenantRepository.findByCode(code);
    }

    @Override
    public Tenant save(Tenant tenant) {
        return tenantRepository.save(tenant);
    }
}
