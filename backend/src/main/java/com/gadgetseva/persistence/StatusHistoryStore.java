package com.gadgetseva.persistence;

import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.entity.StatusHistory;
import java.util.List;

public interface StatusHistoryStore {

    StatusHistory save(StatusHistory statusHistory);

    List<StatusHistory> findByServiceRequestOrderByChangedAtAsc(ServiceRequest serviceRequest);
}
