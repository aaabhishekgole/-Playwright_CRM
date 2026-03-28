package com.gadgetseva.config;

import com.gadgetseva.entity.Role;
import com.gadgetseva.entity.RoleName;
import com.gadgetseva.entity.Tenant;
import com.gadgetseva.entity.User;
import com.gadgetseva.repository.RoleRepository;
import com.gadgetseva.repository.TenantRepository;
import com.gadgetseva.repository.UserRepository;
import java.util.Arrays;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class StartupDataSeeder {

    @Bean
    @Order(1)
    CommandLineRunner seedAdmin(UserRepository userRepository,
                                RoleRepository roleRepository,
                                TenantRepository tenantRepository,
                                PasswordEncoder passwordEncoder) {
        return args -> {
            ensureRoles(roleRepository);

            Tenant tenant = tenantRepository.findByCode("GSH-CORE").orElseGet(() -> {
                Tenant created = new Tenant();
                created.setCode("GSH-CORE");
                created.setName("Gadget Seva Hub Direct");
                created.setPartnerType("DIRECT");
                created.setGstin("29ABCDE1234F1Z5");
                created.setDefaultSlaHours(48);
                return tenantRepository.save(created);
            });

            seedUser(userRepository, roleRepository, passwordEncoder, tenant,
                    "admin", "System Administrator", "admin@gadgetseva.local", "9999999999", RoleName.ADMIN);
            seedUser(userRepository, roleRepository, passwordEncoder, tenant,
                    "support", "Customer Support", "support@gadgetseva.local", "9999999995", RoleName.CUSTOMER_SUPPORT);
            seedUser(userRepository, roleRepository, passwordEncoder, tenant,
                    "backend", "Backend Operations", "backend@gadgetseva.local", "9999999998", RoleName.BACKEND_TEAM);
            seedUser(userRepository, roleRepository, passwordEncoder, tenant,
                    "pickup", "Vishal Babar", "vishal.babar@gadgetseva.local", "9999999994", RoleName.PICKUP_AGENT);
            seedUser(userRepository, roleRepository, passwordEncoder, tenant,
                    "tech", "Repair Technician", "tech@gadgetseva.local", "9999999993", RoleName.TECHNICIAN);
            seedUser(userRepository, roleRepository, passwordEncoder, tenant,
                    "delivery", "Delivery Runner", "delivery@gadgetseva.local", "9999999992", RoleName.DELIVERY_AGENT);
            seedUser(userRepository, roleRepository, passwordEncoder, tenant,
                    "mse", "MSE Coordinator", "mse@gadgetseva.local", "9999999997", RoleName.MSE_TEAM);
            seedUser(userRepository, roleRepository, passwordEncoder, tenant,
                    "finance", "Finance Executive", "finance@gadgetseva.local", "9999999996", RoleName.FINANCE);
        };
    }

    private void ensureRoles(RoleRepository roleRepository) {
        Arrays.stream(RoleName.values()).forEach(roleName -> roleRepository.findByName(roleName).orElseGet(() -> {
            Role role = new Role();
            role.setName(roleName);
            return roleRepository.save(role);
        }));
    }

    private void seedUser(UserRepository userRepository,
                          RoleRepository roleRepository,
                          PasswordEncoder passwordEncoder,
                          Tenant tenant,
                          String username,
                          String fullName,
                          String email,
                          String phone,
                          RoleName roleName) {
        Role role = roleRepository.findByName(roleName).orElse(null);
        if (role == null) {
            return;
        }

        User user = userRepository.findByUsername(username).orElseGet(User::new);
        user.setFullName(fullName);
        user.setUsername(username);
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode("Admin@123"));
        }
        user.setEmail(email);
        user.setPhone(phone);
        user.setWhatsappNumber(phone);
        user.setRole(role);
        user.setTenant(tenant);
        user.setActive(true);
        userRepository.save(user);
    }
}
