package com.gadgetseva.repository;

import com.gadgetseva.entity.Pickup;
import com.gadgetseva.entity.ServiceRequest;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PickupRepository extends JpaRepository<Pickup, Long> {
    Optional<Pickup> findByServiceRequest(ServiceRequest serviceRequest);
}
