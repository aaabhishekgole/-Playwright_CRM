package com.gadgetseva.persistence;

import com.gadgetseva.entity.PaymentTransaction;
import com.gadgetseva.entity.ServiceRequest;
import java.util.List;
import java.util.Optional;

public interface PaymentTransactionStore {

    PaymentTransaction save(PaymentTransaction paymentTransaction);

    Optional<PaymentTransaction> findById(Long id);

    List<PaymentTransaction> findByServiceRequestOrderByCreatedAtDesc(ServiceRequest serviceRequest);
}
