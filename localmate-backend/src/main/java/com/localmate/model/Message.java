package com.localmate.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    private String id;

    @Indexed
    private String conversationId; // Shared conversation ID between two participants

    @Indexed
    private String senderId;

    @Indexed
    private String receiverId;

    private String content;

    private String imgAttachment;

    @Builder.Default
    private String messageType = "TEXT"; // TEXT, IMAGE, LOCATION

    private Double latitude;

    private Double longitude;

    private String locationName;

    @Builder.Default
    private Boolean isRead = false;

    @CreatedDate
    private Instant createdAt;
}
