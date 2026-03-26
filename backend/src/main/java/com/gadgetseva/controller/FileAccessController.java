package com.gadgetseva.controller;

import com.gadgetseva.service.FileStorageService;
import java.net.URLConnection;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/files")
public class FileAccessController {

    private final FileStorageService fileStorageService;

    public FileAccessController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/access")
    public ResponseEntity<Resource> access(@RequestParam String key,
                                           @RequestParam long expires,
                                           @RequestParam String signature) {
        Resource resource = fileStorageService.loadSecureFile(key, expires, signature);
        String contentType = URLConnection.guessContentTypeFromName(resource.getFilename());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType != null ? contentType : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                .body(resource);
    }
}