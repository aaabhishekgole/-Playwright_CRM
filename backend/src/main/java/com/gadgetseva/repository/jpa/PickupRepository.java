package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.Pickup;
import com.gadgetseva.entity.ServiceRequest;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PickupRepository extends JpaRepository<Pickup, Long> {
    Optional<Pickup> findByServiceRequest(ServiceRequest serviceRequest);
    Optional<Pickup> findByRunnerPortalToken(String runnerPortalToken);
}
