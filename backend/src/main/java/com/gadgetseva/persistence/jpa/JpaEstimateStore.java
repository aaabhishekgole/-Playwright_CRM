package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.Estimate;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.EstimateStore;
import com.gadgetseva.repository.jpa.EstimateRepository;
import java.util.Optional;
import com.gadgetseva.persistence.JpaPersistenceAdapter;

@JpaPersistenceAdapter
public class JpaEstimateStore implements EstimateStore {

    private final EstimateRepository estimateRepository;

    public JpaEstimateStore(EstimateRepository estimateRepository) {
        this.estimateRepository = estimateRepository;
    }

    @Override
    public Optional<Estimate> findByServiceRequest(ServiceRequest serviceRequest) {
        return estimateRepository.findByServiceRequest(serviceRequest);
    }

    @Override
    public Estimate save(Estimate estimate) {
        return estimateRepository.save(estimate);
    }
}
