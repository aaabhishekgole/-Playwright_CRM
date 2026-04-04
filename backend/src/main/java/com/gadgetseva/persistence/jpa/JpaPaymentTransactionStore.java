package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.PaymentTransaction;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.PaymentTransactionStore;
import com.gadgetseva.repository.jpa.PaymentTransactionRepository;
import java.util.List;
import java.util.Optional;
import com.gadgetseva.persistence.JpaPersistenceAdapter;

@JpaPersistenceAdapter
public class JpaPaymentTransactionStore implements PaymentTransactionStore {

    private final PaymentTransactionRepository paymentTransactionRepository;

    public JpaPaymentTransactionStore(PaymentTransactionRepository paymentTransactionRepository) {
        this.paymentTransactionRepository = paymentTransactionRepository;
    }

    @Override
    public PaymentTransaction save(PaymentTransaction paymentTransaction) {
        return paymentTransactionRepository.save(paymentTransaction);
    }

    @Override
    public Optional<PaymentTransaction> findById(Long id) {
        return paymentTransactionRepository.findById(id);
    }

    @Override
    public List<PaymentTransaction> findByServiceRequestOrderByCreatedAtDesc(ServiceRequest serviceRequest) {
        return paymentTransactionRepository.findByServiceRequestOrderByCreatedAtDesc(serviceRequest);
    }
}
