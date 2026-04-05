package com.gadgetseva.repository.jpa;

import com.gadgetseva.entity.DocumentRecord;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRecordRepository extends JpaRepository<DocumentRecord, Long> {
    List<DocumentRecord> findAllByOrderByUploadedAtDesc();
    List<DocumentRecord> findByCategoryIgnoreCaseOrderByUploadedAtDesc(String category);
}
