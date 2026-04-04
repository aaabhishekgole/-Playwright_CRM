package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.Attachment;
import com.gadgetseva.entity.ServiceRequest;
import com.gadgetseva.persistence.AttachmentStore;
import com.gadgetseva.repository.jpa.AttachmentRepository;
import java.util.List;
import java.util.Optional;
import com.gadgetseva.persistence.JpaPersistenceAdapter;

@JpaPersistenceAdapter
public class JpaAttachmentStore implements AttachmentStore {

    private final AttachmentRepository attachmentRepository;

    public JpaAttachmentStore(AttachmentRepository attachmentRepository) {
        this.attachmentRepository = attachmentRepository;
    }

    @Override
    public Attachment save(Attachment attachment) {
        return attachmentRepository.save(attachment);
    }

    @Override
    public List<Attachment> findByServiceRequest(ServiceRequest serviceRequest) {
        return attachmentRepository.findByServiceRequest(serviceRequest);
    }

    @Override
    public Optional<Attachment> findByIdAndServiceRequest(Long id, ServiceRequest serviceRequest) {
        return attachmentRepository.findByIdAndServiceRequest(id, serviceRequest);
    }

    @Override
    public boolean existsByServiceRequestAndAttachmentType(ServiceRequest serviceRequest, String attachmentType) {
        return attachmentRepository.existsByServiceRequestAndAttachmentType(serviceRequest, attachmentType);
    }

    @Override
    public long countByServiceRequestAndAttachmentTypeStartingWith(ServiceRequest serviceRequest, String prefix) {
        return attachmentRepository.countByServiceRequestAndAttachmentTypeStartingWith(serviceRequest, prefix);
    }

    @Override
    public void delete(Attachment attachment) {
        attachmentRepository.delete(attachment);
    }
}
