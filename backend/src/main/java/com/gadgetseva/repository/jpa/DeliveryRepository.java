package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.Delivery;
import com.gadgetseva.entity.ServiceRequest;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Optional<Delivery> findByServiceRequest(ServiceRequest serviceRequest);
}
