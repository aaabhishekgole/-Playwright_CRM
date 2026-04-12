package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.ClaimApprovalLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimApprovalLogRepository extends JpaRepository<ClaimApprovalLog, Long> {
    List<ClaimApprovalLog> findByClaimIdOrderByActionAtDesc(Long claimId);
}
