package com.localmate.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GoogleAuthRequest {
    private String credential; // Google ID Token
    private String email;
    private String fullName;
    private String avatarUrl;
}
