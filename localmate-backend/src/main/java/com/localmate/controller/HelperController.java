package com.localmate.controller;

import com.localmate.model.Booking;
import com.localmate.repository.BookingRepository;
import com.localmate.model.HelperProfile;
import com.localmate.model.User;
import com.localmate.repository.HelperProfileRepository;
import com.localmate.repository.UserRepository;
import com.localmate.model.Review;
import com.localmate.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/helpers")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class HelperController {

    private final UserRepository userRepository;
    private final HelperProfileRepository helperProfileRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllHelpers(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String lang,
            @RequestParam(required = false) Boolean featured) {

        List<HelperProfile> profiles = helperProfileRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (HelperProfile profile : profiles) {
            Optional<User> userOpt = userRepository.findById(profile.getUserId());
            if (userOpt.isEmpty()) continue;
            User user = userOpt.get();

            Map<String, Object> map = toHelperMap(user, profile);

            // Filter location / city
            String targetCity = city != null ? city : location;
            if (targetCity != null && !targetCity.trim().isEmpty()) {
                String profileCity = profile.getCity() != null ? profile.getCity().toLowerCase() : "";
                if (!profileCity.contains(targetCity.toLowerCase().trim())) {
                    continue;
                }
            }

            // Filter language
            if (lang != null && !lang.trim().isEmpty() && !lang.equalsIgnoreCase("All")) {
                boolean hasLang = profile.getLanguages() != null && profile.getLanguages().stream()
                        .anyMatch(l -> l.equalsIgnoreCase(lang.trim()));
                if (!hasLang) continue;
            }

            result.add(map);
        }

        // Sort by rating descending
        result.sort((a, b) -> {
            Double rA = (Double) a.getOrDefault("rating", 0.0);
            Double rB = (Double) b.getOrDefault("rating", 0.0);
            return rB.compareTo(rA);
        });

        if (Boolean.TRUE.equals(featured) && result.size() > 4) {
            result = result.subList(0, 4);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHelperById(@PathVariable String id) {
        // Try finding by userId
        Optional<HelperProfile> profileOpt = helperProfileRepository.findByUserId(id);
        Optional<User> userOpt = userRepository.findById(id);

        // Try finding by profile id
        if (profileOpt.isEmpty()) {
            profileOpt = helperProfileRepository.findById(id);
            if (profileOpt.isPresent()) {
                userOpt = userRepository.findById(profileOpt.get().getUserId());
            }
        }

        // Try finding by email / slug prefix
        if (profileOpt.isEmpty() || userOpt.isEmpty()) {
            List<User> users = userRepository.findAll();
            for (User u : users) {
                if (u.getEmail() != null && (u.getEmail().startsWith(id.toLowerCase()) || u.getFullName().toLowerCase().contains(id.toLowerCase()))) {
                    userOpt = Optional.of(u);
                    profileOpt = helperProfileRepository.findByUserId(u.getId());
                    break;
                }
            }
        }

        if (userOpt.isEmpty() || profileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> map = toHelperMap(userOpt.get(), profileOpt.get());
        return ResponseEntity.ok(map);
    }

    private Map<String, Object> toHelperMap(User user, HelperProfile profile) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("userId", user.getId());
        map.put("profileId", profile.getId());
        map.put("name", user.getFullName());
        map.put("fullName", user.getFullName());
        map.put("email", user.getEmail());
        map.put("phone", user.getPhone());
        map.put("city", profile.getCity() != null ? profile.getCity() : "Vietnam");
        map.put("location", profile.getCity() != null ? profile.getCity() : "Vietnam");
        map.put("country", "Vietnam");
        map.put("title", profile.getTitle());
        map.put("bio", profile.getBio());
        // Fetch real reviews from MongoDB
        List<Review> reviews = reviewRepository.findByHelperIdOrderByCreatedAtDesc(user.getId());
        if (reviews.isEmpty() && profile.getId() != null) {
            reviews = reviewRepository.findByHelperIdOrderByCreatedAtDesc(profile.getId());
        }

        double displayRating;
        int displayReviewCount;

        if (!reviews.isEmpty()) {
            double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(5.0);
            displayRating = Math.round(avg * 10.0) / 10.0;
            displayReviewCount = reviews.size();
        } else {
            displayRating = profile.getRating() != null ? profile.getRating() : 5.0;
            displayReviewCount = profile.getReviewCount() != null ? profile.getReviewCount() : 0;
        }

        map.put("rating", displayRating);
        map.put("reviewsCount", displayReviewCount);

        List<Map<String, Object>> mappedReviews = reviews.stream().map(r -> {
            Map<String, Object> revMap = new HashMap<>();
            revMap.put("id", r.getId());
            revMap.put("author", r.getTravelerName() != null ? r.getTravelerName() : "Verified Traveler");
            revMap.put("avatar", r.getTravelerAvatar());
            revMap.put("rating", r.getRating());
            revMap.put("text", r.getComment());
            revMap.put("date", r.getCreatedAt() != null ? r.getCreatedAt().toString().substring(0, 10) : "Recently");
            revMap.put("createdAt", r.getCreatedAt());
            return revMap;
        }).collect(Collectors.toList());
        map.put("reviews", mappedReviews);
        map.put("languages", profile.getLanguages() != null ? profile.getLanguages() : List.of("English"));
        map.put("skills", profile.getSkills() != null ? profile.getSkills() : List.of());
        map.put("expertises", profile.getSkills() != null 
                ? profile.getSkills().stream().map(String::toUpperCase).collect(Collectors.toList()) 
                : List.of("LOCAL EXPERT"));

        // Format price in USD (if stored as VND ~25,000 / USD, or directly in USD)
        double rate = profile.getHourlyRate() != null ? profile.getHourlyRate() : 10.0;
        double displayPrice = rate > 1000 ? Math.round(rate / 25000.0) : rate;
        map.put("price", displayPrice);
        map.put("hourlyRate", displayPrice);
        map.put("priceRaw", rate);

        String avatar = user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty() 
                ? user.getAvatarUrl() 
                : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";
        map.put("img", avatar);
        map.put("avatar", avatar);
        map.put("verified", profile.getVerified() != null ? profile.getVerified() : true);
        map.put("availabilityDays", profile.getAvailabilityDays());
        map.put("availabilityStatus", profile.getAvailabilityStatus() != null ? profile.getAvailabilityStatus() : "AVAILABLE");

        return map;
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateHelperStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || (!newStatus.equalsIgnoreCase("AVAILABLE") && !newStatus.equalsIgnoreCase("BUSY") && !newStatus.equalsIgnoreCase("OFFLINE"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status. Must be AVAILABLE, BUSY, or OFFLINE."));
        }
        String upperStatus = newStatus.toUpperCase();

        Optional<HelperProfile> profileOpt = helperProfileRepository.findByUserId(id);
        if (profileOpt.isEmpty()) {
            profileOpt = helperProfileRepository.findById(id);
        }
        if (profileOpt.isEmpty()) {
            List<User> users = userRepository.findAll();
            for (User u : users) {
                if (u.getEmail() != null && (u.getEmail().equalsIgnoreCase(id) || u.getEmail().startsWith(id.toLowerCase()))) {
                    profileOpt = helperProfileRepository.findByUserId(u.getId());
                    break;
                }
            }
        }

        if (profileOpt.isPresent()) {
            HelperProfile profile = profileOpt.get();
            profile.setAvailabilityStatus(upperStatus);
            helperProfileRepository.save(profile);
            return ResponseEntity.ok(Map.of("message", "Status updated successfully", "status", upperStatus));
        }

        return ResponseEntity.notFound().build();
    }

    @RequestMapping(value = "/{id}/price", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<?> updateHelperPrice(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Object rateObj = body.get("hourlyRate");
        if (rateObj == null) {
            rateObj = body.get("price");
        }
        if (rateObj == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "hourlyRate or price is required"));
        }

        double newRate;
        try {
            newRate = Double.parseDouble(rateObj.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid hourly rate value"));
        }

        if (newRate <= 0 || newRate > 1000) {
            return ResponseEntity.badRequest().body(Map.of("message", "Hourly rate must be between $1 and $1,000/hr"));
        }

        Optional<HelperProfile> profileOpt = helperProfileRepository.findByUserId(id);
        Optional<User> userOpt = userRepository.findById(id);

        if (profileOpt.isEmpty()) {
            profileOpt = helperProfileRepository.findById(id);
            if (profileOpt.isPresent()) {
                userOpt = userRepository.findById(profileOpt.get().getUserId());
            }
        }

        if (profileOpt.isEmpty()) {
            List<User> users = userRepository.findAll();
            for (User u : users) {
                if (u.getEmail() != null && (u.getEmail().equalsIgnoreCase(id) || u.getEmail().startsWith(id.toLowerCase()))) {
                    userOpt = Optional.of(u);
                    profileOpt = helperProfileRepository.findByUserId(u.getId());
                    break;
                }
            }
        }

        if (profileOpt.isPresent()) {
            HelperProfile profile = profileOpt.get();
            profile.setHourlyRate(newRate);
            helperProfileRepository.save(profile);

            User user = userOpt.orElseGet(() -> userRepository.findById(profile.getUserId()).orElse(null));
            if (user != null) {
                return ResponseEntity.ok(toHelperMap(user, profile));
            }
            return ResponseEntity.ok(Map.of("message", "Price updated successfully", "hourlyRate", newRate));
        }

        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/schedule")
    public ResponseEntity<?> getHelperSchedule(
            @PathVariable String id,
            @RequestParam(required = false) String date) {
        Optional<HelperProfile> profileOpt = helperProfileRepository.findByUserId(id);
        String helperUserId = id;
        if (profileOpt.isEmpty()) {
            profileOpt = helperProfileRepository.findById(id);
            if (profileOpt.isPresent()) {
                helperUserId = profileOpt.get().getUserId();
            } else {
                List<User> users = userRepository.findAll();
                for (User u : users) {
                    if (u.getEmail() != null && (u.getEmail().equalsIgnoreCase(id) || u.getEmail().startsWith(id.toLowerCase()))) {
                        helperUserId = u.getId();
                        profileOpt = helperProfileRepository.findByUserId(u.getId());
                        break;
                    }
                }
            }
        } else {
            helperUserId = profileOpt.get().getUserId();
        }

        String currentStatus = profileOpt.map(HelperProfile::getAvailabilityStatus).orElse("AVAILABLE");

        LocalDate targetDate = null;
        if (date != null && !date.isBlank()) {
            try {
                targetDate = LocalDate.parse(date.trim());
            } catch (Exception ignored) {}
        }

        List<Booking> bookings = bookingRepository.findByHelperId(helperUserId);
        final LocalDate filterDate = targetDate;
        List<Map<String, Object>> busySlots = bookings.stream()
                .filter(b -> {
                    if (filterDate != null && b.getBookingDate() != null && !filterDate.equals(b.getBookingDate())) {
                        return false;
                    }
                    return "PENDING".equalsIgnoreCase(b.getStatus()) ||
                           "ACCEPTED".equalsIgnoreCase(b.getStatus()) ||
                           "CONFIRMED".equalsIgnoreCase(b.getStatus());
                })
                .map(b -> {
                    Map<String, Object> slot = new HashMap<>();
                    slot.put("id", b.getId());
                    slot.put("bookingDate", b.getBookingDate());
                    slot.put("startTime", b.getStartTime() != null ? b.getStartTime() : "09:00");
                    slot.put("endTime", b.getEndTime() != null ? b.getEndTime() : "13:00");
                    slot.put("status", b.getStatus());
                    slot.put("tourName", b.getTourName());
                    return slot;
                })
                .toList();

        return ResponseEntity.ok(Map.of(
                "helperId", helperUserId,
                "availabilityStatus", currentStatus,
                "date", date != null ? date : "",
                "busySlots", busySlots
        ));
    }

    @SuppressWarnings("unchecked")
    @PostMapping
    public ResponseEntity<?> createHelper(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        if (userRepository.existsByEmail(email.trim().toLowerCase())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists"));
        }

        String name = (String) body.getOrDefault("name", "Local Helper");
        String phone = (String) body.getOrDefault("phone", "+84 912 345 678");
        String city = (String) body.getOrDefault("city", "Đà Nẵng");
        String title = (String) body.getOrDefault("title", "Local Guide & Explorer");
        String bio = (String) body.getOrDefault("bio", "Experienced local guide ready to share authentic local culture.");
        String avatar = (String) body.getOrDefault("avatar", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150");
        String availability = (String) body.getOrDefault("availabilityStatus", "AVAILABLE");

        List<String> languages = body.get("languages") instanceof List ? (List<String>) body.get("languages") : List.of("Tiếng Việt", "Tiếng Anh");
        List<String> skills = body.get("skills") instanceof List ? (List<String>) body.get("skills") : List.of("Food Tour", "Culture");

        double rate = 12.0;
        if (body.get("hourlyRate") != null) {
            try { rate = Double.parseDouble(body.get("hourlyRate").toString()); } catch (Exception ignored) {}
        }

        User user = User.builder()
                .email(email.trim().toLowerCase())
                .fullName(name)
                .phone(phone)
                .avatarUrl(avatar)
                .roles(Set.of("ROLE_HELPER"))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .build();
        user = userRepository.save(user);

        HelperProfile profile = HelperProfile.builder()
                .userId(user.getId())
                .title(title)
                .bio(bio)
                .city(city)
                .languages(languages)
                .skills(skills)
                .hourlyRate(rate)
                .rating(5.0)
                .reviewCount(0)
                .verified(true)
                .availabilityStatus(availability.toUpperCase())
                .createdAt(Instant.now())
                .build();
        profile = helperProfileRepository.save(profile);

        return ResponseEntity.ok(toHelperMap(user, profile));
    }

    @SuppressWarnings("unchecked")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateHelper(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Optional<HelperProfile> profileOpt = helperProfileRepository.findByUserId(id);
        Optional<User> userOpt = userRepository.findById(id);

        if (profileOpt.isEmpty()) {
            profileOpt = helperProfileRepository.findById(id);
            if (profileOpt.isPresent()) {
                userOpt = userRepository.findById(profileOpt.get().getUserId());
            }
        }

        if (profileOpt.isEmpty()) {
            List<User> users = userRepository.findAll();
            for (User u : users) {
                if (u.getEmail() != null && u.getEmail().equalsIgnoreCase(id)) {
                    userOpt = Optional.of(u);
                    profileOpt = helperProfileRepository.findByUserId(u.getId());
                    break;
                }
            }
        }

        if (profileOpt.isPresent() && userOpt.isPresent()) {
            HelperProfile profile = profileOpt.get();
            User user = userOpt.get();

            if (body.containsKey("name") && body.get("name") != null) {
                user.setFullName(body.get("name").toString());
            }
            if (body.containsKey("fullName") && body.get("fullName") != null) {
                user.setFullName(body.get("fullName").toString());
            }
            if (body.containsKey("phone") && body.get("phone") != null) {
                user.setPhone(body.get("phone").toString());
            }
            if (body.containsKey("avatar") && body.get("avatar") != null) {
                user.setAvatarUrl(body.get("avatar").toString());
            }
            if (body.containsKey("status") && body.get("status") != null) {
                user.setStatus(body.get("status").toString().toUpperCase());
            }

            if (body.containsKey("city") && body.get("city") != null) {
                profile.setCity(body.get("city").toString());
            }
            if (body.containsKey("title") && body.get("title") != null) {
                profile.setTitle(body.get("title").toString());
            }
            if (body.containsKey("bio") && body.get("bio") != null) {
                profile.setBio(body.get("bio").toString());
            }
            if (body.containsKey("availabilityStatus") && body.get("availabilityStatus") != null) {
                profile.setAvailabilityStatus(body.get("availabilityStatus").toString().toUpperCase());
            }
            if (body.containsKey("hourlyRate") && body.get("hourlyRate") != null) {
                try { profile.setHourlyRate(Double.parseDouble(body.get("hourlyRate").toString())); } catch (Exception ignored) {}
            }
            if (body.containsKey("languages") && body.get("languages") instanceof List) {
                profile.setLanguages((List<String>) body.get("languages"));
            }

            userRepository.save(user);
            helperProfileRepository.save(profile);

            return ResponseEntity.ok(toHelperMap(user, profile));
        }

        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHelper(@PathVariable String id) {
        Optional<HelperProfile> profileOpt = helperProfileRepository.findByUserId(id);
        Optional<User> userOpt = userRepository.findById(id);

        if (profileOpt.isEmpty()) {
            profileOpt = helperProfileRepository.findById(id);
            if (profileOpt.isPresent()) {
                userOpt = userRepository.findById(profileOpt.get().getUserId());
            }
        }

        if (profileOpt.isPresent()) {
            helperProfileRepository.delete(profileOpt.get());
        }
        userOpt.ifPresent(userRepository::delete);

        return ResponseEntity.ok(Map.of("message", "Helper deleted successfully", "id", id));
    }
}
