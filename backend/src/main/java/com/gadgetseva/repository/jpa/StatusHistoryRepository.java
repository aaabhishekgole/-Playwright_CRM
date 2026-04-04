package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.entity.StatusHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StatusHistoryRepository extends JpaRepository<StatusHistory, Long> {
    List<StatusHistory> findByServiceRequestOrderByChangedAtAsc(ServiceRequest serviceRequest);
}
