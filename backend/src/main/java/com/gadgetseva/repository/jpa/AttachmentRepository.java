package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.Attachment;
import com.gadgetseva.entity.ServiceRequest;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByServiceRequest(ServiceRequest serviceRequest);
    Optional<Attachment> findByIdAndServiceRequest(Long id, ServiceRequest serviceRequest);
    boolean existsByServiceRequestAndAttachmentType(ServiceRequest serviceRequest, String attachmentType);
    long countByServiceRequestAndAttachmentTypeStartingWith(ServiceRequest serviceRequest, String attachmentTypePrefix);
}
