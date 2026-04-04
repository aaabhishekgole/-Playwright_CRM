package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.Invoice;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.InvoiceStore;
import com.gadgetseva.repository.jpa.InvoiceRepository;
import java.util.Optional;
import com.gadgetseva.persistence.JpaPersistenceAdapter;

@JpaPersistenceAdapter
public class JpaInvoiceStore implements InvoiceStore {

    private final InvoiceRepository invoiceRepository;

    public JpaInvoiceStore(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @Override
    public Optional<Invoice> findByServiceRequest(ServiceRequest serviceRequest) {
        return invoiceRepository.findByServiceRequest(serviceRequest);
    }

    @Override
    public Invoice save(Invoice invoice) {
        return invoiceRepository.save(invoice);
    }
}
