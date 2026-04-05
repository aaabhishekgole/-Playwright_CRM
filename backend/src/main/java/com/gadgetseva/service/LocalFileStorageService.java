package com.gadgetseva.service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LocalFileStorageService implements FileStorageService {

    private final Path rootPath;
    private final String baseUrl;
    private final String signingSecret;

    public LocalFileStorageService(@Value("${app.storage.root-path}") String rootPath,
                                   @Value("${app.storage.base-url}") String baseUrl,
                                   @Value("${app.storage.signing-secret}") String signingSecret) {
        this.rootPath = Path.of(rootPath);
        this.baseUrl = baseUrl;
        this.signingSecret = signingSecret;
    }

    @Override
    public StoredFileDescriptor store(Long requestId, MultipartFile file) {
        return storeInFolder(String.valueOf(requestId), file);
    }

    @Override
    public StoredFileDescriptor storeInFolder(String folder, MultipartFile file) {
        try {
            Path targetFolder = rootPath.resolve(folder);
            Files.createDirectories(targetFolder);
            String safeName = UUID.randomUUID() + "-" + file.getOriginalFilename();
            Path target = targetFolder.resolve(safeName).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return new StoredFileDescriptor(folder + "/" + safeName, checksum(target));
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to store file in folder: " + folder, exception);
        }
    }

    @Override
    public String generateSignedUrl(String objectKey, Instant expiresAt) {
        long expires = expiresAt.getEpochSecond();
        String signature = sign(objectKey, expires);
        return baseUrl + "/api/files/access?key=" + URLEncoder.encode(objectKey, StandardCharsets.UTF_8)
                + "&expires=" + expires
                + "&signature=" + signature;
    }

    @Override
    public Resource loadSecureFile(String objectKey, long expiresAtEpochSeconds, String signature) {
        if (Instant.now().getEpochSecond() > expiresAtEpochSeconds) {
            throw new IllegalStateException("Signed URL expired");
        }
        if (!sign(objectKey, expiresAtEpochSeconds).equals(signature)) {
            throw new IllegalStateException("Invalid file signature");
        }
        Path target = rootPath.resolve(objectKey).normalize();
        if (!target.startsWith(rootPath.normalize()) || !Files.exists(target)) {
            throw new IllegalStateException("File not found");
        }
        return new PathResource(target);
    }

    @Override
    public void delete(String objectKey) {
        Path target = rootPath.resolve(objectKey).normalize();
        if (!target.startsWith(rootPath.normalize())) {
            throw new IllegalStateException("Invalid file path");
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to delete attachment", exception);
        }
    }

    private String checksum(Path path) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(Files.readAllBytes(path));
            return HexFormat.of().formatHex(bytes);
        } catch (Exception exception) {
            throw new IOException("Failed to calculate checksum", exception);
        }
    }

    private String sign(String objectKey, long expires) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signingSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] value = mac.doFinal((objectKey + ":" + expires).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign file URL", exception);
        }
    }
}
