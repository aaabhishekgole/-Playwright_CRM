package com.gadgetseva.persistence;

import com.gadgetseva.entity.RoleName;
import com.gadgetseva.entity.User;
import java.util.List;
import java.util.Optional;

public interface UserStore {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByPhone(String phone);

    Optional<User> findById(Long id);

    List<User> findAllOrderByFullNameAsc();

    List<User> findActiveOrderByFullNameAsc();

    List<User> findByRoleOrderByFullNameAsc(RoleName roleName);

    List<User> findActiveByRoleOrderByFullNameAsc(RoleName roleName);

    User save(User user);
}
