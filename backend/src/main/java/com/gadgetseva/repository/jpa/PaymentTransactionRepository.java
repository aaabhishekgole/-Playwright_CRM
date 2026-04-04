package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.PaymentTransaction;
import com.gadgetseva.entity.ServiceRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    List<PaymentTransaction> findByServiceRequestOrderByCreatedAtDesc(ServiceRequest serviceRequest);
}
