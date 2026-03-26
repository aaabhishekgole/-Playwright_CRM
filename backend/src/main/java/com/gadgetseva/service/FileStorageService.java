package com.gadgetseva.service;

import java.time.Instant;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    StoredFileDescriptor store(Long requestId, MultipartFile file);
    String generateSignedUrl(String objectKey, Instant expiresAt);
    Resource loadSecureFile(String objectKey, long expiresAtEpochSeconds, String signature);
    void delete(String objectKey);
}
