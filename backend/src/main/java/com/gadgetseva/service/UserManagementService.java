package com.gadgetseva.service;

import com.gadgetseva.dto.CreatePickupRunnerRequest;
import com.gadgetseva.dto.UserSummaryResponse;
import com.gadgetseva.entity.Role;
import com.gadgetseva.entity.RoleName;
import com.gadgetseva.entity.Tenant;
import com.gadgetseva.entity.User;
import com.gadgetseva.exception.ApiException;
import com.gadgetseva.exception.NotFoundException;
import com.gadgetseva.persistence.RoleStore;
import com.gadgetseva.persistence.TenantStore;
import com.gadgetseva.persistence.UserStore;
import jakarta.transaction.Transactional;
import java.text.Normalizer;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class UserManagementService {

    private final UserStore userStore;
    private final RoleStore roleStore;
    private final TenantStore tenantStore;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(UserStore userStore,
                                 RoleStore roleStore,
                                 TenantStore tenantStore,
                                 PasswordEncoder passwordEncoder) {
        this.userStore = userStore;
        this.roleStore = roleStore;
        this.tenantStore = tenantStore;
        this.passwordEncoder = passwordEncoder;
    }

    public UserSummaryResponse createPickupRunner(CreatePickupRunnerRequest request) {
        Role pickupRole = roleStore.findByName(RoleName.PICKUP_AGENT)
                .orElseThrow(() -> new NotFoundException("Pickup runner role is not configured"));
        Tenant tenant = tenantStore.findByCode("GSH-CORE")
                .orElseThrow(() -> new NotFoundException("Default tenant GSH-CORE is not configured"));

        String normalizedPhone = normalizeIndianMobile(request.phone(), "Mobile number");
        String normalizedWhatsapp = request.whatsappNumber() == null || request.whatsappNumber().isBlank()
                ? normalizedPhone
                : normalizeIndianMobile(request.whatsappNumber(), "WhatsApp number");

        userStore.findByPhone(normalizedPhone).ifPresent(existing -> {
            throw new ApiException("A pickup runner already exists with mobile number " + normalizedPhone);
        });

        String username = resolveUsername(request.username(), request.fullName(), normalizedPhone);
        if (userStore.findByUsername(username).isPresent()) {
            throw new ApiException("Username " + username + " is already in use");
        }

        String email = resolveEmail(request.email(), username);
        userStore.findByEmailIgnoreCase(email).ifPresent(existing -> {
            throw new ApiException("Email " + email + " is already in use");
        });

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode("Runner@" + normalizedPhone.substring(6)));
        user.setEmail(email);
        user.setPhone(normalizedPhone);
        user.setWhatsappNumber(normalizedWhatsapp);
        user.setRole(pickupRole);
        user.setTenant(tenant);
        user.setActive(request.active() == null || request.active());
        userStore.save(user);

        return toSummary(user);
    }

    public UserSummaryResponse toSummary(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getWhatsappNumber(),
                user.getRole().getName().name(),
                user.getTenant() != null ? user.getTenant().getCode() : null,
                user.isActive()
        );
    }

    private String resolveUsername(String preferredUsername, String fullName, String phone) {
        if (preferredUsername != null && !preferredUsername.isBlank()) {
            return sanitizeUsername(preferredUsername);
        }

        String base = sanitizeUsername(fullName);
        if (base.isBlank()) {
            base = "pickup.runner";
        }
        base = base + "." + phone.substring(6);

        String candidate = base;
        int suffix = 2;
        while (userStore.findByUsername(candidate).isPresent()) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }

    private String resolveEmail(String preferredEmail, String username) {
        if (preferredEmail != null && !preferredEmail.isBlank()) {
            return preferredEmail.trim().toLowerCase(Locale.ROOT);
        }
        return username + "@gadgetseva.local";
    }

    private String sanitizeUsername(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", ".");
        return normalized.replaceAll("(^\\.+|\\.+$)", "");
    }

    private String normalizeIndianMobile(String value, String label) {
        String digits = value == null ? "" : value.replaceAll("\\D", "");
        if (digits.length() == 12 && digits.startsWith("91")) {
            digits = digits.substring(2);
        } else if (digits.length() == 11 && digits.startsWith("0")) {
            digits = digits.substring(1);
        }

        if (!digits.matches("\\d{10}")) {
            throw new ApiException(label + " must be a valid 10-digit Indian number");
        }
        return digits;
    }
}
