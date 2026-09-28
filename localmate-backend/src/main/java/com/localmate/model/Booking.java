package com.localmate.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

@Document(collection = "bookings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    private String id;

    @Indexed
    private String travelerId; // ID of the traveler booking the service

    @Indexed
    private String helperId; // ID of the booked local helper

    private String tourName; // Tour / service name requested

    private LocalDate bookingDate; // Booking start date

    private Integer durationHours; // Estimated duration in hours

    private String meetLocation; // Meeting location

    private String specialRequests; // Special requirements from traveler

    private Double totalPrice; // Total service fee

    @Builder.Default
    private String status = "PENDING"; // PENDING, ACCEPTED, DECLINED, COMPLETED, CANCELLED

    @Builder.Default
    private String paymentStatus = "UNPAID"; // UNPAID, PAID, REFUNDED

    private String startTime; // e.g. "14:00"
    private String endTime;   // e.g. "18:00"

    private Instant sentAt;    // Request sent timestamp
    private Instant expiresAt; // Expiration timestamp (e.g. 15 minutes after sent)

    // Realtime Location Sharing fields
    private Double customerLatitude;
    private Double customerLongitude;
    private Instant customerLocationUpdatedAt;
    @Builder.Default
    private Boolean customerSharingLocation = false;

    private Double helperLatitude;
    private Double helperLongitude;
    private Instant helperLocationUpdatedAt;
    @Builder.Default
    private Boolean helperSharingLocation = false;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
