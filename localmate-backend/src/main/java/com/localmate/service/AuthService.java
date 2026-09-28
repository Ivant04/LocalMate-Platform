package com.localmate.service;

import com.localmate.dto.request.*;
import com.localmate.dto.response.AuthenticationResponse;
import com.localmate.model.User;
import com.localmate.repository.UserRepository;
import com.localmate.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Collections;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AuthService {
    private final UserRepository userRepository;
    private final com.localmate.repository.HelperProfileRepository helperProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthenticationResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("This email is already in use!");
        }

        String role = request.getRole() != null ? request.getRole().toUpperCase() : "TRAVELER";
        if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }

        var user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .roles(Collections.singleton(role))
                .build();
        user = userRepository.save(user);

        // If registering as Helper, initialize default HelperProfile
        if ("ROLE_HELPER".equals(role)) {
            var profile = com.localmate.model.HelperProfile.builder()
                    .userId(user.getId())
                    .title("Local Helper")
                    .bio("Hello, I am " + user.getFullName() + "! Excited to show you around.")
                    .city("Da Nang")
                    .languages(java.util.List.of("English", "Vietnamese"))
                    .skills(java.util.List.of("Local Exploration", "Food Tour"))
                    .hourlyRate(15.0)
                    .rating(5.0)
                    .reviewCount(0)
                    .verified(false)
                    .build();
            helperProfileRepository.save(profile);
        }

        String token = jwtService.generateToken(user.getEmail());
        return AuthenticationResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles())
                .build();
    }

    public AuthenticationResponse login(AuthenticationRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Account not found!"));

        String token = jwtService.generateToken(user.getEmail());
        return AuthenticationResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles())
                .build();
    }
}