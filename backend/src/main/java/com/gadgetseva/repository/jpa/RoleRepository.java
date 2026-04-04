package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.Role;
import com.gadgetseva.entity.RoleName;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}
