package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.Pickup;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.PickupStore;
import com.gadgetseva.repository.jpa.PickupRepository;
import java.util.Optional;
import com.gadgetseva.persistence.JpaPersistenceAdapter;

@JpaPersistenceAdapter
public class JpaPickupStore implements PickupStore {

    private final PickupRepository pickupRepository;

    public JpaPickupStore(PickupRepository pickupRepository) {
        this.pickupRepository = pickupRepository;
    }

    @Override
    public Optional<Pickup> findByServiceRequest(ServiceRequest serviceRequest) {
        return pickupRepository.findByServiceRequest(serviceRequest);
    }

    @Override
    public Optional<Pickup> findByRunnerPortalToken(String runnerPortalToken) {
        return pickupRepository.findByRunnerPortalToken(runnerPortalToken);
    }

    @Override
    public Pickup save(Pickup pickup) {
        return pickupRepository.save(pickup);
    }
}
