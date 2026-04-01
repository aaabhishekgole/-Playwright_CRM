package com.gadgetseva.persistence;

import com.gadgetseva.entity.Estimate;
import com.gadgetseva.entity.ServiceRequest;
import java.util.Optional;

public interface EstimateStore {

    Optional<Estimate> findByServiceRequest(ServiceRequest serviceRequest);

    Estimate save(Estimate estimate);
}
