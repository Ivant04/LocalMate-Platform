package com.localmate.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "payment_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransaction {

    @Id
    private String id;

    @Indexed
    private String bookingId;

    @Indexed
    private String travelerId;

    private Double amount;

    private String currency; // "VND" or "USD"

    private String paymentMethod; // "VNPAY", "MOMO", "CREDIT_CARD", "CASH"

    private String transactionRef; // Transaction reference from payment gateway

    @Builder.Default
    private String status = "PENDING"; // PENDING, SUCCESS, FAILED, REFUNDED

    @CreatedDate
    private Instant createdAt;
}
