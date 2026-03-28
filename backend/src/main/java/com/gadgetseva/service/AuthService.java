package com.gadgetseva.service;

import com.gadgetseva.dto.AuthResponse;
import com.gadgetseva.dto.LoginRequest;
import com.gadgetseva.entity.User;
import com.gadgetseva.exception.ApiException;
import com.gadgetseva.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final com.gadgetseva.security.JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       com.gadgetseva.security.JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        User user = resolveLoginUser(request.username());
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(user.getUsername(), request.password()));
        return new AuthResponse(
                jwtService.generateToken(user),
                "Bearer",
                user.getUsername(),
                user.getRole().getName().name(),
                user.getFullName(),
                user.getPhone()
        );
    }

    private User resolveLoginUser(String loginIdentifier) {
        String candidate = loginIdentifier == null ? "" : loginIdentifier.trim();
        return userRepository.findByUsername(candidate)
                .or(() -> userRepository.findByPhone(normalizePhone(candidate)))
                .orElseThrow(() -> new ApiException("Invalid username or mobile number"));
    }

    private String normalizePhone(String value) {
        String digits = value.replaceAll("\\D", "");
        if (digits.length() == 12 && digits.startsWith("91")) {
            return digits.substring(2);
        }
        if (digits.length() == 11 && digits.startsWith("0")) {
            return digits.substring(1);
        }
        return digits;
    }
}
