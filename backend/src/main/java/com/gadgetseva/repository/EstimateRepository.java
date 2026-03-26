package com.gadgetseva.repository;

import com.gadgetseva.entity.Estimate;
import com.gadgetseva.entity.ServiceRequest;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstimateRepository extends JpaRepository<Estimate, Long> {
    Optional<Estimate> findByServiceRequest(ServiceRequest serviceRequest);
}
