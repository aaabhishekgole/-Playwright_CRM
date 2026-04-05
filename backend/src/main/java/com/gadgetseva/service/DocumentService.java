package com.gadgetseva.service;

import com.gadgetseva.entity.DocumentRecord;
import com.gadgetseva.entity.User;
import com.gadgetseva.persistence.DocumentStore;
import com.gadgetseva.persistence.UserStore;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentService {

    private static final String DOCUMENT_FOLDER = "documents";
    private static final long SIGNED_URL_TTL_SECONDS = 900L;

    private final DocumentStore documentStore;
    private final FileStorageService fileStorageService;
    private final UserStore userStore;

    public DocumentService(DocumentStore documentStore,
                           FileStorageService fileStorageService,
                           UserStore userStore) {
        this.documentStore = documentStore;
        this.fileStorageService = fileStorageService;
        this.userStore = userStore;
    }

    public DocumentRecord upload(String name, String description, String category, MultipartFile file) {
        StoredFileDescriptor stored = fileStorageService.storeInFolder(DOCUMENT_FOLDER, file);

        DocumentRecord doc = new DocumentRecord();
        doc.setName(name != null && !name.isBlank() ? name : file.getOriginalFilename());
        doc.setDescription(description);
        doc.setCategory(category);
        doc.setFileName(file.getOriginalFilename());
        doc.setContentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
        doc.setObjectKey(stored.objectKey());
        doc.setFileSize(file.getSize());
        doc.setChecksum(stored.checksum());
        doc.setUploadedAt(Instant.now());
        doc.setUploadedBy(resolveCurrentUser());
        return documentStore.save(doc);
    }

    public List<DocumentRecord> listAll() {
        return documentStore.findAllOrderByUploadedAtDesc();
    }

    public List<DocumentRecord> listByCategory(String category) {
        return documentStore.findByCategoryIgnoreCaseOrderByUploadedAtDesc(category);
    }

    public DocumentRecord getById(long id) {
        return documentStore.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Document not found: " + id));
    }

    public void delete(long id) {
        DocumentRecord doc = getById(id);
        fileStorageService.delete(doc.getObjectKey());
        documentStore.delete(doc);
    }

    public String buildSignedUrl(String objectKey) {
        Instant expiresAt = Instant.now().plusSeconds(SIGNED_URL_TTL_SECONDS);
        return fileStorageService.generateSignedUrl(objectKey, expiresAt);
    }

    private User resolveCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userStore.findByUsername(username).orElse(null);
    }
}
