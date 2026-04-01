package com.gadgetseva.persistence;

import com.gadgetseva.entity.Delivery;
import com.gadgetseva.entity.ServiceRequest;
import java.util.Optional;

public interface DeliveryStore {

    Optional<Delivery> findByServiceRequest(ServiceRequest serviceRequest);

    Delivery save(Delivery delivery);
}
