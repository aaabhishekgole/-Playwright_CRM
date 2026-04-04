package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.Invoice;
import com.gadgetseva.entity.ServiceRequest;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByServiceRequest(ServiceRequest serviceRequest);
}
