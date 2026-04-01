package com.gadgetseva.config;

import com.gadgetseva.entity.Role;
import com.gadgetseva.entity.RoleName;
import com.gadgetseva.entity.Tenant;
import com.gadgetseva.entity.User;
import com.gadgetseva.persistence.RoleStore;
import com.gadgetseva.persistence.TenantStore;
import com.gadgetseva.persistence.UserStore;
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
    CommandLineRunner seedAdmin(UserStore userStore,
                                RoleStore roleStore,
                                TenantStore tenantStore,
                                PasswordEncoder passwordEncoder) {
        return args -> {
            ensureRoles(roleStore);

            Tenant tenant = tenantStore.findByCode("GSH-CORE").orElseGet(() -> {
                Tenant created = new Tenant();
                created.setCode("GSH-CORE");
                created.setName("Gadget Seva Hub Direct");
                created.setPartnerType("DIRECT");
                created.setGstin("29ABCDE1234F1Z5");
                created.setDefaultSlaHours(48);
                return tenantStore.save(created);
            });

            seedUser(userStore, roleStore, passwordEncoder, tenant,
                    "admin", "System Administrator", "admin@gadgetseva.local", "9999999999", RoleName.ADMIN);
            seedUser(userStore, roleStore, passwordEncoder, tenant,
                    "support", "Customer Support", "support@gadgetseva.local", "9999999995", RoleName.CUSTOMER_SUPPORT);
            seedUser(userStore, roleStore, passwordEncoder, tenant,
                    "backend", "Backend Operations", "backend@gadgetseva.local", "9999999998", RoleName.BACKEND_TEAM);
            seedUser(userStore, roleStore, passwordEncoder, tenant,
                    "pickup", "Vishal Babar", "vishal.babar@gadgetseva.local", "9999999994", RoleName.PICKUP_AGENT);
            seedUser(userStore, roleStore, passwordEncoder, tenant,
                    "tech", "Repair Technician", "tech@gadgetseva.local", "9999999993", RoleName.TECHNICIAN);
            seedUser(userStore, roleStore, passwordEncoder, tenant,
                    "delivery", "Delivery Runner", "delivery@gadgetseva.local", "9999999992", RoleName.DELIVERY_AGENT);
            seedUser(userStore, roleStore, passwordEncoder, tenant,
                    "mse", "MSE Coordinator", "mse@gadgetseva.local", "9999999997", RoleName.MSE_TEAM);
            seedUser(userStore, roleStore, passwordEncoder, tenant,
                    "finance", "Finance Executive", "finance@gadgetseva.local", "9999999996", RoleName.FINANCE);
        };
    }

    private void ensureRoles(RoleStore roleStore) {
        Arrays.stream(RoleName.values()).forEach(roleName -> roleStore.findByName(roleName).orElseGet(() -> {
            Role role = new Role();
            role.setName(roleName);
            return roleStore.save(role);
        }));
    }

    private void seedUser(UserStore userStore,
                          RoleStore roleStore,
                          PasswordEncoder passwordEncoder,
                          Tenant tenant,
                          String username,
                          String fullName,
                          String email,
                          String phone,
                          RoleName roleName) {
        Role role = roleStore.findByName(roleName).orElse(null);
        if (role == null) {
            return;
        }

        User user = userStore.findByUsername(username).orElseGet(User::new);
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
        userStore.save(user);
    }
}
