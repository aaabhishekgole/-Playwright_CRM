package com.gadgetseva.persistence;

import com.gadgetseva.entity.Role;
import com.gadgetseva.entity.RoleName;
import java.util.Optional;

public interface RoleStore {

    Optional<Role> findByName(RoleName name);

    Role save(Role role);
}
