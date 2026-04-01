package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.Invoice;
import com.gadgetseva.entity.InvoiceLineItem;
import com.gadgetseva.persistence.InvoiceLineItemStore;
import com.gadgetseva.repository.InvoiceLineItemRepository;
import java.util.List;
import com.gadgetseva.persistence.JpaPersistenceAdapter;

@JpaPersistenceAdapter
public class JpaInvoiceLineItemStore implements InvoiceLineItemStore {

    private final InvoiceLineItemRepository invoiceLineItemRepository;

    public JpaInvoiceLineItemStore(InvoiceLineItemRepository invoiceLineItemRepository) {
        this.invoiceLineItemRepository = invoiceLineItemRepository;
    }

    @Override
    public InvoiceLineItem save(InvoiceLineItem invoiceLineItem) {
        return invoiceLineItemRepository.save(invoiceLineItem);
    }

    @Override
    public List<InvoiceLineItem> findByInvoiceOrderByIdAsc(Invoice invoice) {
        return invoiceLineItemRepository.findByInvoiceOrderByIdAsc(invoice);
    }
}
