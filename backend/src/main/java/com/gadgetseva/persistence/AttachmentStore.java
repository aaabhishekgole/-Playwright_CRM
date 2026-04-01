package com.gadgetseva.persistence;

import com.gadgetseva.entity.Attachment;
import com.gadgetseva.entity.ServiceRequest;
import java.util.List;
import java.util.Optional;

public interface AttachmentStore {

    Attachment save(Attachment attachment);

    List<Attachment> findByServiceRequest(ServiceRequest serviceRequest);

    Optional<Attachment> findByIdAndServiceRequest(Long id, ServiceRequest serviceRequest);

    boolean existsByServiceRequestAndAttachmentType(ServiceRequest serviceRequest, String attachmentType);

    long countByServiceRequestAndAttachmentTypeStartingWith(ServiceRequest serviceRequest, String prefix);

    void delete(Attachment attachment);
}
