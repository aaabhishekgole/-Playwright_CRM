package com.gadgetseva.persistence;

import com.gadgetseva.entity.DocumentRecord;
import java.util.List;
import java.util.Optional;

public interface DocumentStore {

    DocumentRecord save(DocumentRecord document);

    List<DocumentRecord> findAllOrderByUploadedAtDesc();

    List<DocumentRecord> findByCategoryIgnoreCaseOrderByUploadedAtDesc(String category);

    Optional<DocumentRecord> findById(long id);

    void delete(DocumentRecord document);
}
