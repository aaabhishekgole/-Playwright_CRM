package com.gadgetseva.controller;

import com.gadgetseva.dto.CreatePickupRunnerRequest;
import com.gadgetseva.dto.UserSummaryResponse;
import com.gadgetseva.entity.RoleName;
import com.gadgetseva.repository.UserRepository;
import com.gadgetseva.service.UserManagementService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final UserManagementService userManagementService;

    public UserController(UserRepository userRepository, UserManagementService userManagementService) {
        this.userRepository = userRepository;
        this.userManagementService = userManagementService;
    }

    @GetMapping
    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','TECHNICIAN','PICKUP_AGENT','DELIVERY_AGENT','FINANCE','MSE_TEAM')")
    public ResponseEntity<List<UserSummaryResponse>> list(@RequestParam(required = false) RoleName role,
                                                          @RequestParam(defaultValue = "false") boolean activeOnly) {
        List<UserSummaryResponse> users = (role == null
                ? (activeOnly ? userRepository.findByActiveTrueOrderByFullNameAsc() : userRepository.findAllByOrderByFullNameAsc())
                : (activeOnly ? userRepository.findByRole_NameAndActiveTrueOrderByFullNameAsc(role) : userRepository.findByRole_NameOrderByFullNameAsc(role)))
                .stream()
                .map(userManagementService::toSummary)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/pickup-runners")
    @PreAuthorize("hasAnyRole('ADMIN','BACKEND_TEAM')")
    public ResponseEntity<UserSummaryResponse> createPickupRunner(@Valid @RequestBody CreatePickupRunnerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userManagementService.createPickupRunner(request));
    }
}
