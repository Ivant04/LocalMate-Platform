package com.localmate.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String password;

    private String fullName;

    private String phone;

    private String avatarUrl;

    @Builder.Default
    private Set<String> roles = new HashSet<>();

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, BLOCKED

    @Builder.Default
    private String gender = "Other"; // Nam, Nữ, Khác

    @Builder.Default
    private String location = "Việt Nam";

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
