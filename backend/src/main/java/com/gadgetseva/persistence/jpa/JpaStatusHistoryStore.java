package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.entity.StatusHistory;
import com.gadgetseva.persistence.StatusHistoryStore;
import com.gadgetseva.repository.jpa.StatusHistoryRepository;
import java.util.List;
import com.gadgetseva.persistence.JpaPersistenceAdapter;

@JpaPersistenceAdapter
public class JpaStatusHistoryStore implements StatusHistoryStore {

    private final StatusHistoryRepository statusHistoryRepository;

    public JpaStatusHistoryStore(StatusHistoryRepository statusHistoryRepository) {
        this.statusHistoryRepository = statusHistoryRepository;
    }

    @Override
    public StatusHistory save(StatusHistory statusHistory) {
        return statusHistoryRepository.save(statusHistory);
    }

    @Override
    public List<StatusHistory> findByServiceRequestOrderByChangedAtAsc(ServiceRequest serviceRequest) {
        return statusHistoryRepository.findByServiceRequestOrderByChangedAtAsc(serviceRequest);
    }
}
