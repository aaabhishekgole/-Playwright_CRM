package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.Claim;
import com.gadgetseva.entity.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByClaimStatusOrderBySubmittedAtDesc(ClaimStatus claimStatus);
    List<Claim> findAllByOrderBySubmittedAtDesc();
    Optional<Claim> findByClaimNumber(String claimNumber);
    Optional<Claim> findByServiceRequestId(Long serviceRequestId);
}
