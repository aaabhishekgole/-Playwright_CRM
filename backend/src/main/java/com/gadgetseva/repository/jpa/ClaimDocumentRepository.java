package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.ClaimDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimDocumentRepository extends JpaRepository<ClaimDocument, Long> {
    List<ClaimDocument> findByClaimIdAndIsCurrentTrue(Long claimId);
    List<ClaimDocument> findByClaimIdOrderByVersionNumberDesc(Long claimId);
    int countByClaimIdAndDocumentTypeAndIsCurrentTrue(Long claimId, String documentType);
}
