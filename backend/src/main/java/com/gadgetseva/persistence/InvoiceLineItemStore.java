package com.gadgetseva.persistence;

import com.gadgetseva.entity.Invoice;
import com.gadgetseva.entity.InvoiceLineItem;
import java.util.List;

public interface InvoiceLineItemStore {

    InvoiceLineItem save(InvoiceLineItem invoiceLineItem);

    List<InvoiceLineItem> findByInvoiceOrderByIdAsc(Invoice invoice);
}
