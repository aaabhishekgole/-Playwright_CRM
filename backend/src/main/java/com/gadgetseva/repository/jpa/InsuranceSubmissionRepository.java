package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.InsuranceSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InsuranceSubmissionRepository extends JpaRepository<InsuranceSubmission, Long> {
    Optional<InsuranceSubmission> findByClaimId(Long claimId);
    List<InsuranceSubmission> findBySubStatusOrderByCreatedAtDesc(String subStatus);
}
