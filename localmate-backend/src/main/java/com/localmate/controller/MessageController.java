package com.localmate.controller;

import com.localmate.model.Message;
import com.localmate.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class MessageController {

    private final MessageRepository messageRepository;

    @GetMapping("/{conversationId}")
    public ResponseEntity<List<Message>> getMessages(@PathVariable String conversationId) {
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        return ResponseEntity.ok(messages != null ? messages : List.of());
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<?> clearAllMessages() {
        long count = messageRepository.count();
        messageRepository.deleteAll();
        return ResponseEntity.ok(Map.of("message", "All messages have been deleted", "deletedCount", count));
    }

    @PostMapping("/clear-all")
    public ResponseEntity<?> clearAllMessagesPost() {
        long count = messageRepository.count();
        messageRepository.deleteAll();
        return ResponseEntity.ok(Map.of("message", "All messages have been deleted", "deletedCount", count));
    }

    @GetMapping("/clear-all")
    public ResponseEntity<?> clearAllMessagesGet() {
        long count = messageRepository.count();
        messageRepository.deleteAll();
        return ResponseEntity.ok(Map.of("message", "All messages have been deleted", "deletedCount", count));
    }

    @PostMapping
    public ResponseEntity<Message> sendMessage(@RequestBody Message message) {
        if (message.getCreatedAt() == null) {
            message.setCreatedAt(Instant.now());
        }
        if (message.getMessageType() == null || message.getMessageType().isBlank()) {
            if (message.getLatitude() != null && message.getLongitude() != null) {
                message.setMessageType("LOCATION");
            } else if (message.getImgAttachment() != null && !message.getImgAttachment().isBlank()) {
                message.setMessageType("IMAGE");
            } else {
                message.setMessageType("TEXT");
            }
        }
        Message saved = messageRepository.save(message);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/auto-reply")
    public ResponseEntity<Message> autoReply(@RequestBody Map<String, String> payload) {
        String conversationId = payload.getOrDefault("conversationId", "sarah");
        String replyText = payload.getOrDefault("text", "Sounds wonderful! Let me know if you need any recommendations in advance. 😊");

        Message reply = Message.builder()
                .conversationId(conversationId)
                .senderId(conversationId)
                .receiverId("me")
                .content(replyText)
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        Message saved = messageRepository.save(reply);
        return ResponseEntity.ok(saved);
    }
}
