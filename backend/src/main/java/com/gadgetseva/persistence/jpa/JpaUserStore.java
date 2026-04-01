package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.RoleName;
import com.gadgetseva.entity.User;
import com.gadgetseva.persistence.UserStore;
import com.gadgetseva.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import com.gadgetseva.persistence.JpaPersistenceAdapter;

@JpaPersistenceAdapter
public class JpaUserStore implements UserStore {

    private final UserRepository userRepository;

    public JpaUserStore(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public Optional<User> findByEmailIgnoreCase(String email) {
        return userRepository.findByEmailIgnoreCase(email);
    }

    @Override
    public Optional<User> findByPhone(String phone) {
        return userRepository.findByPhone(phone);
    }

    @Override
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public List<User> findAllOrderByFullNameAsc() {
        return userRepository.findAllByOrderByFullNameAsc();
    }

    @Override
    public List<User> findActiveOrderByFullNameAsc() {
        return userRepository.findByActiveTrueOrderByFullNameAsc();
    }

    @Override
    public List<User> findByRoleOrderByFullNameAsc(RoleName roleName) {
        return userRepository.findByRole_NameOrderByFullNameAsc(roleName);
    }

    @Override
    public List<User> findActiveByRoleOrderByFullNameAsc(RoleName roleName) {
        return userRepository.findByRole_NameAndActiveTrueOrderByFullNameAsc(roleName);
    }

    @Override
    public User save(User user) {
        return userRepository.save(user);
    }
}
