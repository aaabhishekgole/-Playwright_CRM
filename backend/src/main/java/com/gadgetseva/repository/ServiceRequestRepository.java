package com.gadgetseva.repository;

import com.gadgetseva.entity.RequestStatus;
import com.gadgetseva.entity.ServiceRequest;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    @EntityGraph(attributePaths = {"customer", "device", "assignedPickupAgent", "assignedDeliveryAgent", "assignedTechnician", "tenant"})
    List<ServiceRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);

    @EntityGraph(attributePaths = {"customer", "device", "assignedPickupAgent", "assignedDeliveryAgent", "assignedTechnician", "tenant"})
    List<ServiceRequest> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"customer", "device", "assignedPickupAgent", "assignedDeliveryAgent", "assignedTechnician", "tenant"})
    List<ServiceRequest> findBySlaBreachedFalseAndStatusNotInAndSlaDeadlineAtBefore(List<RequestStatus> statuses, Instant now);
}