package com.localmate.controller;

import com.localmate.model.Booking;
import com.localmate.model.HelperProfile;
import com.localmate.model.Message;
import com.localmate.model.User;
import com.localmate.repository.BookingRepository;
import com.localmate.repository.HelperProfileRepository;
import com.localmate.repository.MessageRepository;
import com.localmate.repository.UserRepository;
import com.localmate.model.Review;
import com.localmate.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final HelperProfileRepository helperProfileRepository;
    private final MessageRepository messageRepository;
    private final ReviewRepository reviewRepository;

    private int parseMinutes(String timeStr, int defaultMinutes) {
        if (timeStr == null || !timeStr.contains(":")) {
            return defaultMinutes;
        }
        try {
            String[] parts = timeStr.trim().split(":");
            return Integer.parseInt(parts[0].trim()) * 60 + Integer.parseInt(parts[1].trim());
        } catch (Exception e) {
            return defaultMinutes;
        }
    }

    private String minutesToTime(int minutes) {
        int h = (minutes / 60) % 24;
        int m = minutes % 60;
        return String.format("%02d:%02d", h, m);
    }

    private void checkAndExpire(List<Booking> bookings) {
        Instant now = Instant.now();
        for (Booking b : bookings) {
            if ("PENDING".equalsIgnoreCase(b.getStatus()) && b.getExpiresAt() != null && b.getExpiresAt().isBefore(now)) {
                b.setStatus("EXPIRED");
                b.setUpdatedAt(now);
                bookingRepository.save(b);
            }
        }
    }

    @Scheduled(fixedRate = 15000)
    public void autoExpireStaleBookings() {
        Instant now = Instant.now();
        List<Booking> pendings = bookingRepository.findAll().stream()
                .filter(b -> "PENDING".equalsIgnoreCase(b.getStatus()) && b.getExpiresAt() != null && b.getExpiresAt().isBefore(now))
                .toList();
        for (Booking b : pendings) {
            b.setStatus("EXPIRED");
            b.setUpdatedAt(now);
            bookingRepository.save(b);
        }
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<Map<String, Object>>> getMyBookings(
            @RequestParam(required = false) String travelerId,
            @RequestParam(required = false) String email
    ) {
        String targetTravelerId = travelerId;

        // If client passes email instead of ID
        if ((targetTravelerId == null || targetTravelerId.isBlank()) && email != null && !email.isBlank()) {
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                targetTravelerId = user.getId();
            }
        }

        if (targetTravelerId != null && !targetTravelerId.isBlank()) {
            List<Booking> bookings = bookingRepository.findByTravelerId(targetTravelerId);
            checkAndExpire(bookings);

            List<Map<String, Object>> response = bookings.stream().map(b -> {
                Map<String, Object> item = new java.util.HashMap<>();
                item.put("id", b.getId());
                item.put("travelerId", b.getTravelerId());
                item.put("helperId", b.getHelperId());
                item.put("tourName", b.getTourName());
                item.put("bookingDate", b.getBookingDate());
                item.put("durationHours", b.getDurationHours());
                item.put("startTime", b.getStartTime() != null ? b.getStartTime() : "09:00");
                item.put("endTime", b.getEndTime() != null ? b.getEndTime() : "13:00");
                item.put("sentAt", b.getSentAt());
                item.put("expiresAt", b.getExpiresAt());
                item.put("meetLocation", b.getMeetLocation());
                item.put("specialRequests", b.getSpecialRequests());
                item.put("totalPrice", b.getTotalPrice());
                item.put("status", b.getStatus());
                item.put("paymentStatus", b.getPaymentStatus());
                item.put("createdAt", b.getCreatedAt());
                item.put("updatedAt", b.getUpdatedAt());

                // Find Helper details for this booking
                User helper = null;
                if (b.getHelperId() != null) {
                    helper = userRepository.findById(b.getHelperId()).orElse(null);
                    if (helper == null) {
                        helper = userRepository.findByEmail(b.getHelperId()).orElse(null);
                    }
                }

                if (helper != null) {
                    item.put("guideName", helper.getFullName());
                    item.put("guideAvatar", helper.getAvatarUrl() != null ? helper.getAvatarUrl() : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200");
                    item.put("guideEmail", helper.getEmail());
                    item.put("guidePhone", helper.getPhone());
                } else {
                    item.put("guideName", "Local Guide");
                    item.put("guideAvatar", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200");
                    item.put("guideEmail", "");
                }

                // Check if this booking has been reviewed
                Optional<Review> reviewOpt = reviewRepository.findFirstByBookingId(b.getId());
                if (reviewOpt.isPresent()) {
                    Review rev = reviewOpt.get();
                    item.put("reviewed", true);
                    item.put("reviewId", rev.getId());
                    item.put("reviewRating", rev.getRating());
                    item.put("reviewComment", rev.getComment());
                    item.put("reviewCreatedAt", rev.getCreatedAt());
                } else {
                    item.put("reviewed", false);
                }
                return item;
            }).toList();
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.ok(List.of());
    }

    @PostMapping
    public ResponseEntity<?> createBooking(
            @RequestBody Booking booking,
            @RequestParam(required = false) String travelerEmail,
            @RequestParam(required = false) String helperEmail
    ) {
        // Resolve Traveler
        if ((booking.getTravelerId() == null || booking.getTravelerId().isBlank()) && travelerEmail != null && !travelerEmail.isBlank()) {
            userRepository.findByEmail(travelerEmail).ifPresent(u -> booking.setTravelerId(u.getId()));
        }

        // Resolve Helper accurately
        String candidateHelper = booking.getHelperId();
        if (candidateHelper != null && !candidateHelper.isBlank()) {
            User helperUser = userRepository.findById(candidateHelper).orElse(null);
            if (helperUser == null) {
                helperUser = userRepository.findByEmail(candidateHelper).orElse(null);
            }
            if (helperUser == null) {
                String slug = candidateHelper.toLowerCase();
                if (slug.contains("kevin")) {
                    helperUser = userRepository.findByEmail("kevin.nguyen@localmate.com").orElse(null);
                } else if (slug.contains("huong")) {
                    helperUser = userRepository.findByEmail("huong.dang@localmate.com").orElse(null);
                } else if (slug.contains("tuan") || slug.contains("khang")) {
                    helperUser = userRepository.findByEmail("tuan.tran@localmate.com").orElse(null);
                } else if (slug.contains("elena")) {
                    helperUser = userRepository.findByEmail("elena.nguyen@localmate.com").orElse(null);
                } else if (slug.contains("linh")) {
                    helperUser = userRepository.findByEmail("linh.hanoi@localmate.com").orElse(null);
                } else if (slug.contains("minh")) {
                    helperUser = userRepository.findByEmail("minh.danang@localmate.com").orElse(null);
                }
            }
            if (helperUser != null) {
                booking.setHelperId(helperUser.getId());
            }
        } else if (helperEmail != null && !helperEmail.isBlank()) {
            userRepository.findByEmail(helperEmail).ifPresent(u -> booking.setHelperId(u.getId()));
        }

        if (booking.getHelperId() == null || booking.getHelperId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Helper ID is required."));
        }

        // 1. Check if Helper is OFFLINE
        Optional<HelperProfile> helperProfileOpt = helperProfileRepository.findByUserId(booking.getHelperId());
        if (helperProfileOpt.isEmpty()) {
            helperProfileOpt = helperProfileRepository.findById(booking.getHelperId());
        }
        if (helperProfileOpt.isPresent()) {
            HelperProfile hp = helperProfileOpt.get();
            if ("OFFLINE".equalsIgnoreCase(hp.getAvailabilityStatus())) {
                return ResponseEntity.status(400).body(Map.of(
                        "message", "Helper is currently OFFLINE and not receiving new bookings.",
                        "code", "HELPER_OFFLINE"
                ));
            }
        }

        // 2. Normalize and compute start & end times
        int duration = booking.getDurationHours() != null && booking.getDurationHours() > 0 ? booking.getDurationHours() : 4;
        booking.setDurationHours(duration);

        int startMin = parseMinutes(booking.getStartTime(), 9 * 60);
        booking.setStartTime(minutesToTime(startMin));

        int endMin;
        if (booking.getEndTime() != null && !booking.getEndTime().isBlank()) {
            endMin = parseMinutes(booking.getEndTime(), startMin + duration * 60);
        } else {
            endMin = startMin + duration * 60;
        }
        booking.setEndTime(minutesToTime(endMin));

        // 3. Check for Schedule Conflicts with existing active bookings on that date
        List<Booking> existingBookings = bookingRepository.findByHelperId(booking.getHelperId());
        for (Booking existing : existingBookings) {
            if (existing.getId() != null && existing.getId().equals(booking.getId())) {
                continue;
            }
            if (booking.getBookingDate() != null && existing.getBookingDate() != null
                    && !booking.getBookingDate().equals(existing.getBookingDate())) {
                continue;
            }
            String exStatus = existing.getStatus();
            if (exStatus == null) continue;
            exStatus = exStatus.toUpperCase();
            if (!exStatus.equals("PENDING") && !exStatus.equals("ACCEPTED") && !exStatus.equals("CONFIRMED")) {
                continue;
            }

            int exStartMin = parseMinutes(existing.getStartTime(), 9 * 60);
            int exDuration = existing.getDurationHours() != null && existing.getDurationHours() > 0 ? existing.getDurationHours() : 4;
            int exEndMin = existing.getEndTime() != null ? parseMinutes(existing.getEndTime(), exStartMin + exDuration * 60) : (exStartMin + exDuration * 60);

            // Overlap check
            if (startMin < exEndMin && endMin > exStartMin) {
                String conflictMsg = String.format("Helper is busy during this time (already booked %s - %s on %s). Please choose another time slot.",
                        minutesToTime(exStartMin), minutesToTime(exEndMin), booking.getBookingDate());
                return ResponseEntity.status(409).body(Map.of(
                        "message", conflictMsg,
                        "code", "SCHEDULE_CONFLICT",
                        "conflictingStart", minutesToTime(exStartMin),
                        "conflictingEnd", minutesToTime(exEndMin)
                ));
            }
        }

        // 4. Create PENDING Booking with 15-minute expiration
        Instant now = Instant.now();
        booking.setSentAt(now);
        booking.setExpiresAt(now.plus(15, ChronoUnit.MINUTES));
        booking.setStatus("PENDING");
        if (booking.getPaymentStatus() == null || booking.getPaymentStatus().isBlank()) {
            booking.setPaymentStatus("PAID");
        }
        booking.setCreatedAt(now);

        Booking saved = bookingRepository.save(booking);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/helper-requests")
    public ResponseEntity<List<Map<String, Object>>> getHelperRequests(
            @RequestParam(required = false) String helperId,
            @RequestParam(required = false) String email
    ) {
        String targetHelperId = helperId;
        if ((targetHelperId == null || targetHelperId.isBlank()) && email != null && !email.isBlank()) {
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                targetHelperId = user.getId();
            }
        }

        List<Booking> bookings;
        if (targetHelperId != null && !targetHelperId.isBlank()) {
            bookings = bookingRepository.findByHelperId(targetHelperId);
        } else {
            bookings = bookingRepository.findAll();
        }
        checkAndExpire(bookings);

        // Populate Traveler info (Name, Phone, Avatar) from database
        List<Map<String, Object>> response = bookings.stream().map(b -> {
            User traveler = null;
            if (b.getTravelerId() != null) {
                traveler = userRepository.findById(b.getTravelerId()).orElse(null);
            }

            Map<String, Object> item = new java.util.HashMap<>();
            item.put("id", b.getId());
            item.put("travelerId", b.getTravelerId());
            item.put("travelerName", traveler != null ? traveler.getFullName() : "Traveler");
            item.put("travelerAvatar", traveler != null && traveler.getAvatarUrl() != null 
                    ? traveler.getAvatarUrl() 
                    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150");
            item.put("phone", traveler != null ? traveler.getPhone() : "");
            item.put("email", traveler != null ? traveler.getEmail() : "");
            item.put("tourName", b.getTourName());
            item.put("date", b.getBookingDate() != null ? b.getBookingDate().toString() : "Upcoming");
            String displayTime = (b.getStartTime() != null ? b.getStartTime() : "09:00") + " - " + 
                                 (b.getEndTime() != null ? b.getEndTime() : "13:00") + 
                                 (b.getDurationHours() != null ? " (" + b.getDurationHours() + "h)" : "");
            item.put("time", displayTime);
            item.put("startTime", b.getStartTime() != null ? b.getStartTime() : "09:00");
            item.put("endTime", b.getEndTime() != null ? b.getEndTime() : "13:00");
            item.put("sentAt", b.getSentAt());
            item.put("expiresAt", b.getExpiresAt());
            item.put("location", b.getMeetLocation());
            item.put("requests", b.getSpecialRequests());
            item.put("price", b.getTotalPrice() != null ? b.getTotalPrice() : 0);
            item.put("status", b.getStatus());
            return item;
        }).toList();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptBooking(@PathVariable String id) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus("ACCEPTED");
            booking.setUpdatedAt(Instant.now());
            Booking saved = bookingRepository.save(booking);

            // Automatically send acceptance message in chat
            try {
                User helper = userRepository.findById(booking.getHelperId())
                        .orElseGet(() -> userRepository.findByEmail(booking.getHelperId()).orElse(null));
                User traveler = userRepository.findById(booking.getTravelerId())
                        .orElseGet(() -> userRepository.findByEmail(booking.getTravelerId()).orElse(null));

                if (helper != null && traveler != null) {
                    String hEmail = helper.getEmail().toLowerCase().trim();
                    String tEmail = traveler.getEmail().toLowerCase().trim();
                    String convId = hEmail.compareTo(tEmail) < 0 ? hEmail + "_" + tEmail : tEmail + "_" + hEmail;

                    String content = "🎉 Booking Accepted! I have confirmed your tour \"" + 
                            booking.getTourName() + "\" on " + booking.getBookingDate() + 
                            " (" + (booking.getStartTime() != null ? booking.getStartTime() : "09:00") + 
                            " - " + (booking.getEndTime() != null ? booking.getEndTime() : "13:00") + "). " +
                            (booking.getMeetLocation() != null && !booking.getMeetLocation().isBlank() 
                                ? "Meeting point: " + booking.getMeetLocation() + ". " 
                                : "") +
                            "I'm excited to guide you!";

                    Message msg = Message.builder()
                            .conversationId(convId)
                            .senderId(hEmail)
                            .receiverId(tEmail)
                            .content(content)
                            .createdAt(Instant.now())
                            .isRead(false)
                            .build();
                    messageRepository.save(msg);
                }
            } catch (Exception ignored) {}

            return ResponseEntity.ok(Map.of(
                    "message", "Booking accepted successfully",
                    "status", "ACCEPTED",
                    "booking", saved
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/decline")
    public ResponseEntity<?> declineBooking(@PathVariable String id) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus("DECLINED");
            booking.setUpdatedAt(Instant.now());
            Booking saved = bookingRepository.save(booking);

            try {
                User helper = userRepository.findById(booking.getHelperId())
                        .orElseGet(() -> userRepository.findByEmail(booking.getHelperId()).orElse(null));
                User traveler = userRepository.findById(booking.getTravelerId())
                        .orElseGet(() -> userRepository.findByEmail(booking.getTravelerId()).orElse(null));

                if (helper != null && traveler != null) {
                    String hEmail = helper.getEmail().toLowerCase().trim();
                    String tEmail = traveler.getEmail().toLowerCase().trim();
                    String convId = hEmail.compareTo(tEmail) < 0 ? hEmail + "_" + tEmail : tEmail + "_" + hEmail;

                    String content = "Notice: I am unable to accept the booking for \"" + 
                            booking.getTourName() + "\" on " + booking.getBookingDate() + 
                            " due to schedule constraints. Please feel free to choose another available time slot!";

                    Message msg = Message.builder()
                            .conversationId(convId)
                            .senderId(hEmail)
                            .receiverId(tEmail)
                            .content(content)
                            .createdAt(Instant.now())
                            .isRead(false)
                            .build();
                    messageRepository.save(msg);
                }
            } catch (Exception ignored) {}

            return ResponseEntity.ok(Map.of(
                    "message", "Booking declined successfully",
                    "status", "DECLINED",
                    "booking", saved
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable String id) {
        return bookingRepository.findById(id).map(booking -> {
            User traveler = null;
            if (booking.getTravelerId() != null) {
                traveler = userRepository.findById(booking.getTravelerId())
                        .orElseGet(() -> userRepository.findByEmail(booking.getTravelerId()).orElse(null));
            }
            User helper = null;
            if (booking.getHelperId() != null) {
                helper = userRepository.findById(booking.getHelperId())
                        .orElseGet(() -> userRepository.findByEmail(booking.getHelperId()).orElse(null));
            }

            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", booking.getId());
            map.put("tourName", booking.getTourName());
            map.put("bookingDate", booking.getBookingDate());
            map.put("durationHours", booking.getDurationHours());
            map.put("startTime", booking.getStartTime());
            map.put("endTime", booking.getEndTime());
            map.put("meetLocation", booking.getMeetLocation());
            map.put("specialRequests", booking.getSpecialRequests());
            map.put("totalPrice", booking.getTotalPrice());
            map.put("status", booking.getStatus());
            map.put("paymentStatus", booking.getPaymentStatus());
            map.put("createdAt", booking.getCreatedAt());
            map.put("updatedAt", booking.getUpdatedAt());

            map.put("travelerId", booking.getTravelerId());
            map.put("travelerName", traveler != null ? traveler.getFullName() : "Traveler");
            map.put("travelerAvatar", traveler != null ? traveler.getAvatarUrl() : "");
            map.put("travelerEmail", traveler != null ? traveler.getEmail() : "");

            map.put("helperId", booking.getHelperId());
            map.put("helperName", helper != null ? helper.getFullName() : "Local Helper");
            map.put("helperAvatar", helper != null ? helper.getAvatarUrl() : "");
            map.put("helperEmail", helper != null ? helper.getEmail() : "");

            map.put("customerSharingLocation", booking.getCustomerSharingLocation());
            map.put("customerLatitude", booking.getCustomerLatitude());
            map.put("customerLongitude", booking.getCustomerLongitude());
            map.put("helperSharingLocation", booking.getHelperSharingLocation());
            map.put("helperLatitude", booking.getHelperLatitude());
            map.put("helperLongitude", booking.getHelperLongitude());

            return ResponseEntity.ok(map);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeBooking(@PathVariable String id) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus("COMPLETED");
            booking.setUpdatedAt(Instant.now());
            Booking saved = bookingRepository.save(booking);
            return ResponseEntity.ok(Map.of(
                    "message", "Booking completed successfully",
                    "status", "COMPLETED",
                    "booking", saved
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable String id) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus("CANCELLED");
            booking.setCustomerSharingLocation(false);
            booking.setHelperSharingLocation(false);
            booking.setUpdatedAt(Instant.now());
            bookingRepository.save(booking);
            return ResponseEntity.ok(Map.of("message", "Booking cancelled successfully", "status", "CANCELLED"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/simulate-expire")
    public ResponseEntity<?> simulateExpire(@PathVariable String id) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setExpiresAt(Instant.now().minus(10, ChronoUnit.SECONDS));
            booking.setStatus("EXPIRED");
            booking.setUpdatedAt(Instant.now());
            Booking saved = bookingRepository.save(booking);
            return ResponseEntity.ok(Map.of("message", "Booking expired simulated", "status", saved.getStatus(), "expiresAt", saved.getExpiresAt()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<?> clearAllBookings() {
        long count = bookingRepository.count();
        bookingRepository.deleteAll();
        return ResponseEntity.ok(Map.of("message", "All bookings have been successfully deleted", "deletedCount", count));
    }

    @PostMapping("/clear-all")
    public ResponseEntity<?> clearAllBookingsPost() {
        long count = bookingRepository.count();
        bookingRepository.deleteAll();
        return ResponseEntity.ok(Map.of("message", "All bookings have been successfully deleted", "deletedCount", count));
    }

    @GetMapping("/clear-all")
    public ResponseEntity<?> clearAllBookingsGet() {
        long count = bookingRepository.count();
        bookingRepository.deleteAll();
        return ResponseEntity.ok(Map.of("message", "All bookings have been successfully deleted", "deletedCount", count));
    }

    @GetMapping("/travelers")
    public ResponseEntity<List<User>> getAllTravelers() {
        List<User> travelers = userRepository.findAll().stream()
                .filter(u -> u.getRoles() != null && u.getRoles().contains("ROLE_TRAVELER"))
                .toList();
        return ResponseEntity.ok(travelers);
    }
}
