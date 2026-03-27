package com.gadgetseva.controller;

import com.gadgetseva.dto.UserSummaryResponse;
import com.gadgetseva.entity.RoleName;
import com.gadgetseva.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','TECHNICIAN','PICKUP_AGENT','DELIVERY_AGENT','FINANCE','MSE_TEAM')")
    public ResponseEntity<List<UserSummaryResponse>> list(@RequestParam(required = false) RoleName role) {
        List<UserSummaryResponse> users = (role == null ? userRepository.findAllByOrderByFullNameAsc() : userRepository.findByRole_NameOrderByFullNameAsc(role))
                .stream()
                .map(user -> new UserSummaryResponse(
                        user.getId(),
                        user.getFullName(),
                        user.getUsername(),
                        user.getRole().getName().name(),
                        user.getTenant() != null ? user.getTenant().getCode() : null,
                        user.isActive()
                ))
                .toList();
        return ResponseEntity.ok(users);
    }
}
