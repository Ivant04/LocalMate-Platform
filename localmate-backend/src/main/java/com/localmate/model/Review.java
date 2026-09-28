package com.localmate.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    private String id;

    @Indexed
    private String bookingId;

    @Indexed
    private String helperId;

    @Indexed
    private String travelerId;

    private String travelerName;

    private String travelerAvatar;

    private Integer rating; // 1 -> 5 sao

    private String comment;

    @CreatedDate
    private Instant createdAt;

    @org.springframework.data.annotation.LastModifiedDate
    private Instant updatedAt;
}
