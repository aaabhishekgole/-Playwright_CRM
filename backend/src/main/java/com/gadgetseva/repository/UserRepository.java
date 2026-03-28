package com.gadgetseva.repository;

import com.gadgetseva.entity.RoleName;
import com.gadgetseva.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByPhone(String phone);
    List<User> findAllByOrderByFullNameAsc();
    List<User> findByActiveTrueOrderByFullNameAsc();
    List<User> findByRole_NameOrderByFullNameAsc(RoleName roleName);
    List<User> findByRole_NameAndActiveTrueOrderByFullNameAsc(RoleName roleName);
}
