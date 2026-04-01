package com.gadgetseva.persistence;

import com.gadgetseva.entity.Invoice;
import com.gadgetseva.entity.ServiceRequest;
import java.util.Optional;

public interface InvoiceStore {

    Optional<Invoice> findByServiceRequest(ServiceRequest serviceRequest);

    Invoice save(Invoice invoice);
}
