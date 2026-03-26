package com.gadgetseva.service;

import com.gadgetseva.dto.AuthResponse;
import com.gadgetseva.dto.LoginRequest;
import com.gadgetseva.entity.User;
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
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        User user = userRepository.findByUsername(request.username()).orElseThrow();
        return new AuthResponse(
                jwtService.generateToken(user),
                "Bearer",
                user.getUsername(),
                user.getRole().getName().name()
        );
    }
}
