package com.localmate.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "helper_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HelperProfile {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId; // Reference to User.id

    private String title; // e.g., "Local Foodie & Culture Explorer in Da Nang"

    private String bio;

    @Indexed
    private String city; // e.g., "Da Nang", "Hanoi", "Ho Chi Minh City"

    private String fullAddress;

    @Builder.Default
    private List<String> languages = new ArrayList<>();

    @Builder.Default
    private List<String> skills = new ArrayList<>(); // e.g., ["Food Tour", "Photography", "History", "Nightlife"]

    private Double hourlyRate; // Hourly rate (USD or VND)

    @Builder.Default
    private Double rating = 5.0;

    @Builder.Default
    private Integer reviewCount = 0;

    @Builder.Default
    private Boolean verified = false;

    @Builder.Default
    private List<String> availabilityDays = new ArrayList<>(); // e.g., ["Monday", "Friday", "Weekend"]

    @Builder.Default
    private List<String> photoGallery = new ArrayList<>();

    @Builder.Default
    private String availabilityStatus = "AVAILABLE"; // AVAILABLE, BUSY, OFFLINE

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
