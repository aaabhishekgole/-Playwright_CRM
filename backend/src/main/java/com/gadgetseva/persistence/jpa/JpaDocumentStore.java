package com.gadgetseva.persistence.jpa;

import com.gadgetseva.entity.DocumentRecord;
import com.gadgetseva.persistence.DocumentStore;
import com.gadgetseva.persistence.JpaPersistenceAdapter;
import com.gadgetseva.repository.jpa.DocumentRecordRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

@JpaPersistenceAdapter
@RequiredArgsConstructor
public class JpaDocumentStore implements DocumentStore {

    private final DocumentRecordRepository documentRecordRepository;

    @Override
    public DocumentRecord save(DocumentRecord document) {
        return documentRecordRepository.save(document);
    }

    @Override
    public List<DocumentRecord> findAllOrderByUploadedAtDesc() {
        return documentRecordRepository.findAllByOrderByUploadedAtDesc();
    }

    @Override
    public List<DocumentRecord> findByCategoryIgnoreCaseOrderByUploadedAtDesc(String category) {
        return documentRecordRepository.findByCategoryIgnoreCaseOrderByUploadedAtDesc(category);
    }

    @Override
    public Optional<DocumentRecord> findById(long id) {
        return documentRecordRepository.findById(id);
    }

    @Override
    public void delete(DocumentRecord document) {
        documentRecordRepository.delete(document);
    }
}
