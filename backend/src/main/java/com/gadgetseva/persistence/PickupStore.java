package com.gadgetseva.persistence;

import com.gadgetseva.entity.Pickup;
import com.gadgetseva.entity.ServiceRequest;
import java.util.Optional;

public interface PickupStore {

    Optional<Pickup> findByServiceRequest(ServiceRequest serviceRequest);

    Optional<Pickup> findByRunnerPortalToken(String runnerPortalToken);

    Pickup save(Pickup pickup);
}
