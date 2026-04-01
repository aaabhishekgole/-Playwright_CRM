package com.gadgetseva.persistence;

import com.gadgetseva.entity.RequestStatus;
import com.gadgetseva.entity.ServiceRequest;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ServiceRequestStore {

    ServiceRequest save(ServiceRequest serviceRequest);

    Optional<ServiceRequest> findById(Long id);

    List<ServiceRequest> findAllOrderByCreatedAtDesc();

    List<ServiceRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);

    List<ServiceRequest> findBySlaBreachedFalseAndStatusNotInAndSlaDeadlineAtBefore(List<RequestStatus> excludedStatuses, Instant deadline);

    List<ServiceRequest> findAllByPartnerReferenceStartingWithOrderByCreatedAtDesc(String partnerReferencePrefix);
}
