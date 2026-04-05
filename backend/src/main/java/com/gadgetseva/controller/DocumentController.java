package com.gadgetseva.controller;

import com.gadgetseva.entity.DocumentRecord;
import com.gadgetseva.service.DocumentService;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM')")
    public ResponseEntity<DocumentResponse> upload(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String category,
            @RequestPart("file") MultipartFile file) {
        DocumentRecord doc = documentService.upload(name, description, category, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(doc));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','FINANCE','MSE_TEAM')")
    public ResponseEntity<List<DocumentResponse>> list(
            @RequestParam(required = false) String category) {
        List<DocumentRecord> docs = category != null && !category.isBlank()
                ? documentService.listByCategory(category)
                : documentService.listAll();
        return ResponseEntity.ok(docs.stream().map(this::toResponse).toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_SUPPORT','BACKEND_TEAM','FINANCE','MSE_TEAM')")
    public ResponseEntity<DocumentResponse> getOne(@PathVariable long id) {
        return ResponseEntity.ok(toResponse(documentService.getById(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable long id) {
        documentService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Document deleted successfully."));
    }

    private DocumentResponse toResponse(DocumentRecord doc) {
        String signedUrl = documentService.buildSignedUrl(doc.getObjectKey());
        String uploadedBy = doc.getUploadedBy() != null ? doc.getUploadedBy().getUsername() : "system";
        return new DocumentResponse(
                doc.getId(),
                doc.getName(),
                doc.getDescription(),
                doc.getCategory(),
                doc.getFileName(),
                doc.getContentType(),
                doc.getObjectKey(),
                doc.getFileSize(),
                doc.getChecksum(),
                signedUrl,
                uploadedBy,
                doc.getUploadedAt()
        );
    }

    public record DocumentResponse(
            Long id,
            String name,
            String description,
            String category,
            String fileName,
            String contentType,
            String objectKey,
            Long fileSize,
            String checksum,
            String signedUrl,
            String uploadedBy,
            Instant uploadedAt
    ) {}
}
