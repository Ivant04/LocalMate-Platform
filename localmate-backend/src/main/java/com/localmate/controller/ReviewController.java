package com.localmate.controller;

import com.localmate.model.Booking;
import com.localmate.model.HelperProfile;
import com.localmate.model.Review;
import com.localmate.model.User;
import com.localmate.repository.BookingRepository;
import com.localmate.repository.HelperProfileRepository;
import com.localmate.repository.ReviewRepository;
import com.localmate.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping({"/api/v1/reviews", "/api/reviews"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final HelperProfileRepository helperProfileRepository;

    @Data
    public static class ReviewDto {
        private String bookingId;
        private String travelerId; // User ID or Email
        private Integer rating;
        private String comment;
    }

    /**
     * Create a review for a completed booking
     */
    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody ReviewDto dto) {
        if (dto.getBookingId() == null || dto.getBookingId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Booking ID is required.",
                    "code", "MISSING_BOOKING_ID"
            ));
        }

        if (dto.getRating() == null || dto.getRating() < 1 || dto.getRating() > 5) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Rating must be between 1 and 5 stars.",
                    "code", "INVALID_RATING"
            ));
        }

        if (dto.getComment() == null || dto.getComment().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Comment cannot be empty.",
                    "code", "EMPTY_COMMENT"
            ));
        }

        // 1. Check if Booking exists
        Optional<Booking> bookingOpt = bookingRepository.findById(dto.getBookingId());
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "message", "Booking not found.",
                    "code", "BOOKING_NOT_FOUND"
            ));
        }
        Booking booking = bookingOpt.get();

        // 2. Check if Booking is COMPLETED
        if (!"COMPLETED".equalsIgnoreCase(booking.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Booking not completed. You cannot review this booking before completion.",
                    "code", "BOOKING_NOT_COMPLETED",
                    "currentStatus", booking.getStatus()
            ));
        }

        // 3. Check if Booking has already been reviewed (One review per booking rule)
        if (reviewRepository.existsByBookingId(booking.getId())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "You have already reviewed this booking.",
                    "code", "ALREADY_REVIEWED"
            ));
        }

        // 4. Validate traveler ownership
        User travelerUser = null;
        if (dto.getTravelerId() != null && !dto.getTravelerId().isBlank()) {
            travelerUser = userRepository.findById(dto.getTravelerId()).orElse(null);
            if (travelerUser == null) {
                travelerUser = userRepository.findByEmail(dto.getTravelerId()).orElse(null);
            }
        }

        // If traveler wasn't passed in body or not resolved, look up booking's travelerId
        if (travelerUser == null && booking.getTravelerId() != null) {
            travelerUser = userRepository.findById(booking.getTravelerId()).orElse(null);
            if (travelerUser == null) {
                travelerUser = userRepository.findByEmail(booking.getTravelerId()).orElse(null);
            }
        }

        // Check ownership against booking.travelerId
        if (dto.getTravelerId() != null && !dto.getTravelerId().isBlank() && travelerUser != null) {
            boolean matchesId = travelerUser.getId().equals(booking.getTravelerId());
            boolean matchesEmail = travelerUser.getEmail() != null && travelerUser.getEmail().equalsIgnoreCase(booking.getTravelerId());
            if (!matchesId && !matchesEmail) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "message", "You cannot review this booking as you are not the traveler who booked it.",
                        "code", "FORBIDDEN_TRAVELER"
                ));
            }
        }

        // 5. Resolve Helper
        User helperUser = null;
        if (booking.getHelperId() != null) {
            helperUser = userRepository.findById(booking.getHelperId()).orElse(null);
            if (helperUser == null) {
                helperUser = userRepository.findByEmail(booking.getHelperId()).orElse(null);
            }
        }

        String helperIdentifier = helperUser != null ? helperUser.getId() : booking.getHelperId();

        // 6. Build and save Review
        Review review = Review.builder()
                .bookingId(booking.getId())
                .helperId(helperIdentifier)
                .travelerId(travelerUser != null ? travelerUser.getId() : booking.getTravelerId())
                .travelerName(travelerUser != null ? travelerUser.getFullName() : "Verified Traveler")
                .travelerAvatar(travelerUser != null && travelerUser.getAvatarUrl() != null 
                        ? travelerUser.getAvatarUrl() 
                        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150")
                .rating(dto.getRating())
                .comment(dto.getComment().trim())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Review savedReview = reviewRepository.save(review);

        // 7. Recalculate dynamic rating and review count for Helper
        List<Review> allReviews = reviewRepository.findByHelperId(helperIdentifier);
        double avg = allReviews.stream().mapToInt(Review::getRating).average().orElse(dto.getRating().doubleValue());
        double roundedRating = Math.round(avg * 10.0) / 10.0;
        int reviewCount = allReviews.size();

        // Update HelperProfile in database
        if (helperIdentifier != null) {
            Optional<HelperProfile> profileOpt = helperProfileRepository.findByUserId(helperIdentifier);
            if (profileOpt.isEmpty()) {
                profileOpt = helperProfileRepository.findById(helperIdentifier);
            }
            if (profileOpt.isPresent()) {
                HelperProfile profile = profileOpt.get();
                profile.setRating(roundedRating);
                profile.setReviewCount(reviewCount);
                profile.setUpdatedAt(Instant.now());
                helperProfileRepository.save(profile);
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "Review submitted successfully!",
                "review", savedReview,
                "helperRating", roundedRating,
                "reviewCount", reviewCount
        ));
    }

    /**
     * Get all reviews for a helper
     */
    @GetMapping("/helper/{helperId}")
    public ResponseEntity<?> getReviewsForHelper(@PathVariable String helperId) {
        String resolvedId = helperId;
        // Check if passed slug or email
        Optional<User> uOpt = userRepository.findById(helperId);
        if (uOpt.isEmpty()) {
            uOpt = userRepository.findByEmail(helperId);
        }
        if (uOpt.isPresent()) {
            resolvedId = uOpt.get().getId();
        } else {
            Optional<HelperProfile> hpOpt = helperProfileRepository.findById(helperId);
            if (hpOpt.isPresent()) {
                resolvedId = hpOpt.get().getUserId();
            }
        }

        List<Review> reviews = reviewRepository.findByHelperIdOrderByCreatedAtDesc(resolvedId);
        if (reviews.isEmpty() && !resolvedId.equals(helperId)) {
            reviews = reviewRepository.findByHelperIdOrderByCreatedAtDesc(helperId);
        }

        double avg = reviews.isEmpty() ? 5.0 : reviews.stream().mapToInt(Review::getRating).average().orElse(5.0);
        double roundedRating = Math.round(avg * 10.0) / 10.0;

        return ResponseEntity.ok(Map.of(
                "helperId", resolvedId,
                "averageRating", roundedRating,
                "reviewCount", reviews.size(),
                "reviews", reviews
        ));
    }

    /**
     * Get review for a specific booking
     */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> getReviewForBooking(@PathVariable String bookingId) {
        return reviewRepository.findFirstByBookingId(bookingId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all reviews or filter by travelerId
     */
    @GetMapping
    public ResponseEntity<List<Review>> getAllReviews(
            @RequestParam(required = false) String travelerId,
            @RequestParam(required = false) String helperId
    ) {
        if (travelerId != null && !travelerId.isBlank()) {
            User u = userRepository.findByEmail(travelerId).orElse(null);
            String idToUse = u != null ? u.getId() : travelerId;
            return ResponseEntity.ok(reviewRepository.findByTravelerIdOrderByCreatedAtDesc(idToUse));
        }
        if (helperId != null && !helperId.isBlank()) {
            return ResponseEntity.ok(reviewRepository.findByHelperIdOrderByCreatedAtDesc(helperId));
        }
        return ResponseEntity.ok(reviewRepository.findAll());
    }
}
