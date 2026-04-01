package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.RequestStatus;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.ServiceRequestStore;
import com.gadgetseva.repository.ServiceRequestRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import com.gadgetseva.persistence.JpaPersistenceAdapter;

@JpaPersistenceAdapter
public class JpaServiceRequestStore implements ServiceRequestStore {

    private final ServiceRequestRepository serviceRequestRepository;

    public JpaServiceRequestStore(ServiceRequestRepository serviceRequestRepository) {
        this.serviceRequestRepository = serviceRequestRepository;
    }

    @Override
    public ServiceRequest save(ServiceRequest serviceRequest) {
        return serviceRequestRepository.save(serviceRequest);
    }

    @Override
    public Optional<ServiceRequest> findById(Long id) {
        return serviceRequestRepository.findById(id);
    }

    @Override
    public List<ServiceRequest> findAllOrderByCreatedAtDesc() {
        return serviceRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public List<ServiceRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status) {
        return serviceRequestRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Override
    public List<ServiceRequest> findBySlaBreachedFalseAndStatusNotInAndSlaDeadlineAtBefore(List<RequestStatus> excludedStatuses, Instant deadline) {
        return serviceRequestRepository.findBySlaBreachedFalseAndStatusNotInAndSlaDeadlineAtBefore(excludedStatuses, deadline);
    }

    @Override
    public List<ServiceRequest> findAllByPartnerReferenceStartingWithOrderByCreatedAtDesc(String partnerReferencePrefix) {
        return serviceRequestRepository.findAllByPartnerReferenceStartingWithOrderByCreatedAtDesc(partnerReferencePrefix);
    }
}
