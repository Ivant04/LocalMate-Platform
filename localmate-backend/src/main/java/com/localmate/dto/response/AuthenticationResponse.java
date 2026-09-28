package com.localmate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {
    private String token;
    private String id;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private Set<String> roles;
}
