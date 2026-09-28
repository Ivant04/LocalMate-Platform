package com.localmate.controller;

import com.localmate.model.User;
import com.localmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestParam String email) {
        return userRepository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody User updatedData) {
        if (updatedData.getEmail() == null || updatedData.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }

        return userRepository.findByEmail(updatedData.getEmail()).map(user -> {
            if (updatedData.getFullName() != null) user.setFullName(updatedData.getFullName());
            if (updatedData.getPhone() != null) user.setPhone(updatedData.getPhone());
            if (updatedData.getAvatarUrl() != null) user.setAvatarUrl(updatedData.getAvatarUrl());
            user.setUpdatedAt(Instant.now());
            userRepository.save(user);
            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }
}
