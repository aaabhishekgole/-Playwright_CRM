package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.InvoiceVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceVerificationRepository extends JpaRepository<InvoiceVerification, Long> {
    Optional<InvoiceVerification> findByClaimId(Long claimId);
    List<InvoiceVerification> findByInvoiceStatusOrderBySubmittedAtDesc(String invoiceStatus);
}
