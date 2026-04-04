package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.Role;
import com.gadgetseva.entity.RoleName;
import com.gadgetseva.persistence.RoleStore;
import com.gadgetseva.repository.jpa.RoleRepository;
import java.util.Optional;
import com.gadgetseva.persistence.JpaPersistenceAdapter;

@JpaPersistenceAdapter
public class JpaRoleStore implements RoleStore {

    private final RoleRepository roleRepository;

    public JpaRoleStore(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public Optional<Role> findByName(RoleName name) {
        return roleRepository.findByName(name);
    }

    @Override
    public Role save(Role role) {
        return roleRepository.save(role);
    }
}
