package com.gadgetseva.repository;

import com.gadgetseva.entity.Invoice;
import com.gadgetseva.entity.InvoiceLineItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceLineItemRepository extends JpaRepository<InvoiceLineItem, Long> {
    List<InvoiceLineItem> findByInvoiceOrderByIdAsc(Invoice invoice);
}