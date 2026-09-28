package com.localmate.config;

import com.localmate.model.*;
import com.localmate.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings({"null", "unused"})
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final HelperProfileRepository helperProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Checking and seeding LocalMate database...");

        // 1. Seed Admin user if not exists
        if (userRepository.findByEmail("admin@localmate.com").isEmpty()) {
            User admin = User.builder()
                    .email("admin@localmate.com")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("LocalMate Administrator")
                    .phone("0900000001")
                    .roles(Set.of("ROLE_ADMIN"))
                    .status("ACTIVE")
                    .createdAt(Instant.now())
                    .build();
            userRepository.save(admin);
        }

        // 2. Seed Helpers if not exists
        userRepository.findByEmail("minh.danang@localmate.com").orElseGet(() -> {
            User h1 = User.builder()
                    .email("minh.danang@localmate.com")
                    .password(passwordEncoder.encode("helper123"))
                    .fullName("Tran Minh")
                    .phone("0901234567")
                    .avatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150")
                    .roles(Set.of("ROLE_HELPER"))
                    .status("ACTIVE")
                    .createdAt(Instant.now())
                    .build();
            h1 = userRepository.save(h1);

            HelperProfile profile1 = HelperProfile.builder()
                    .userId(h1.getId())
                    .title("Local Culinary Specialist & Da Nang - Hoi An Culture Explorer")
                    .bio("Born and raised in Da Nang with 5 years of experience leading international travelers to discover authentic street food.")
                    .city("Da Nang")
                    .fullAddress("Son Tra, Da Nang")
                    .languages(List.of("English", "Vietnamese"))
                    .skills(List.of("Food Tour", "Photography", "Local Culture", "Motorbike"))
                    .hourlyRate(12.0)
                    .rating(4.9)
                    .reviewCount(48)
                    .verified(true)
                    .availabilityDays(List.of("Monday", "Wednesday", "Friday", "Sunday"))
                    .createdAt(Instant.now())
                    .build();
            helperProfileRepository.save(profile1);
            return h1;
        });

        userRepository.findByEmail("linh.hanoi@localmate.com").orElseGet(() -> {
            User h2 = User.builder()
                    .email("linh.hanoi@localmate.com")
                    .password(passwordEncoder.encode("helper123"))
                    .fullName("Nguyen Thuy Linh")
                    .phone("0912345678")
                    .avatarUrl("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150")
                    .roles(Set.of("ROLE_HELPER"))
                    .status("ACTIVE")
                    .createdAt(Instant.now())
                    .build();
            h2 = userRepository.save(h2);

            HelperProfile profile2 = HelperProfile.builder()
                    .userId(h2.getId())
                    .title("Hanoi Old Quarter Storytelling & Traditional Tea Culture")
                    .bio("Passionate about the 36 ancient streets of Hanoi and classic French colonial architecture.")
                    .city("Hanoi")
                    .fullAddress("Hoan Kiem, Hanoi")
                    .languages(List.of("English", "Vietnamese", "French"))
                    .skills(List.of("History", "Art & Design", "Tea & Coffee", "Walking Tour"))
                    .hourlyRate(11.0)
                    .rating(5.0)
                    .reviewCount(32)
                    .verified(true)
                    .availabilityDays(List.of("Saturday", "Sunday"))
                    .createdAt(Instant.now())
                    .build();
            helperProfileRepository.save(profile2);
            return h2;
        });

        // 2.1 Create Featured Guides (Kevin Nguyen, Huong Dang, Tuan Tran, Elena Nguyen)
        createHelperIfNotExists(
                "kevin.nguyen@localmate.com", "Kevin Nguyen.", "0905111222",
                "https://withlocals-com-res.cloudinary.com/image/upload/w_806,h_453,c_fill,g_auto,q_auto,dpr_2.0,f_auto/76ae7360c1ce53020a70263e5af5ab3c",
                "Hoi An & Da Nang Local Foodie & Culture Explorer",
                "Explore Da Nang & Hoi An like a local. Join me for authentic food tours, cultural walks, and photography experiences that reveal the hidden beauty, rich heritage, and vibrant local life of Central Vietnam.",
                "Hoi An, Da Nang", "Tran Phu, Hoi An Ancient Town",
                List.of("English", "Japanese"), List.of("Foodie", "Culture", "Photography", "Motorbike"),
                11.0, 4.9, 154
        );

        createHelperIfNotExists(
                "huong.dang@localmate.com", "Huong Dang.", "0905333444",
                "https://withlocals-com-res.cloudinary.com/image/upload/w_806,h_453,c_fill,g_auto,q_auto,dpr_2.0,f_auto/3d8d6fc8da4e52cd45357b6694ad9638",
                "Imperial Citadel Stories & Authentic Hue Royal Cuisine",
                "Born and raised in Hue, passionate about ancient imperial architecture, royal cuisine, and traditional bamboo craft villages along the Perfume River.",
                "Hue", "Le Loi, Hue City",
                List.of("English", "French"), List.of("Culture", "History", "Traditional Craft", "Walking Tour"),
                9.0, 5.0, 98
        );

        createHelperIfNotExists(
                "tuan.tran@localmate.com", "Tuan Tran", "0905555666",
                "https://withlocals-com-res.cloudinary.com/image/upload/w_806,h_453,c_fill,g_auto,q_auto,dpr_2.0,f_auto/fcff16092478d19ba9d3cbf6fee339f6",
                "Active Nature Explorer & Mountain Trails Guide in Da Nang",
                "Hosting visitors in Da Nang for over 5 years. I love showing visitors around the Marble Mountains, Son Tra Peninsula monkey trails, and coastal viewpoints.",
                "Da Nang", "Ngo Quyen, Son Tra, Da Nang",
                List.of("English", "Spanish"), List.of("Hiking", "Adventure", "Culture", "Translation"),
                10.0, 4.8, 82
        );

        createHelperIfNotExists(
                "elena.nguyen@localmate.com", "Elena Nguyen.", "0905777888",
                "https://withlocals-com-res.cloudinary.com/image/upload/w_806,h_453,c_fill,g_auto,q_auto,dpr_2.0,f_auto/c2766862a165675fe1d55091f3325e1a",
                "Hoi An Heritage Architecture & Sunset River Tour",
                "Local artist and photographer in Hoi An. Discover lantern-making secrets, historic tailor shops, and sunset boat rides across the Thu Bon river.",
                "Hoi An", "Bach Dang, Hoi An Ancient Town",
                List.of("English", "Italian"), List.of("Art & Design", "Photography", "Bicycle Tour", "Lantern Making"),
                12.0, 4.9, 112
        );

        // 3. Seed real travelers into database
        createTravelerIfNotExists(
                "traveler@localmate.com", "Alex Johnson", "0900000002",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        );

        createTravelerIfNotExists(
                "myduyen@localmate.com", "My Duyen", "0988776655",
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"
        );

        createTravelerIfNotExists(
                "sarah.jenkins@localmate.com", "Sarah Jenkins", "+44 7911 123456",
                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"
        );

        createTravelerIfNotExists(
                "david.smith@localmate.com", "David Smith", "+1 202 555 0147",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
        );

        createTravelerIfNotExists(
                "kenji.sato@localmate.com", "Kenji Sato", "+81 90 1234 5678",
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150"
        );

        createTravelerIfNotExists(
                "charlotte.dubois@localmate.com", "Charlotte Dubois", "+33 6 12 34 56 78",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
        );

        createTravelerIfNotExists(
                "marco.rossi@localmate.com", "Marco Rossi", "+39 02 1234567",
                "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"
        );

        createTravelerIfNotExists(
                "bao.nguyen@localmate.com", "Nguyen Gia Bao", "0933112233",
                "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150"
        );

        // 3. Keep bookings empty for test exploration
        log.info("LocalMate database seeding completed (no sample bookings seeded)!");
    }

    private User createTravelerIfNotExists(String email, String fullName, String phone, String avatarUrl) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode("traveler123"))
                    .fullName(fullName)
                    .phone(phone)
                    .avatarUrl(avatarUrl)
                    .roles(Set.of("ROLE_TRAVELER"))
                    .status("ACTIVE")
                    .createdAt(Instant.now())
                    .build();
            return userRepository.save(user);
        });
    }

    private User createHelperIfNotExists(String email, String fullName, String phone, String avatarUrl,
                                         String title, String bio, String city, String fullAddress,
                                         List<String> languages, List<String> skills, Double hourlyRate,
                                         Double rating, Integer reviewCount) {
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User u = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode("helper123"))
                    .fullName(fullName)
                    .phone(phone)
                    .avatarUrl(avatarUrl)
                    .roles(Set.of("ROLE_HELPER"))
                    .status("ACTIVE")
                    .createdAt(Instant.now())
                    .build();
            return userRepository.save(u);
        });

        if (helperProfileRepository.findByUserId(user.getId()).isEmpty()) {
            HelperProfile profile = HelperProfile.builder()
                    .userId(user.getId())
                    .title(title)
                    .bio(bio)
                    .city(city)
                    .fullAddress(fullAddress)
                    .languages(languages)
                    .skills(skills)
                    .hourlyRate(hourlyRate)
                    .rating(rating)
                    .reviewCount(reviewCount)
                    .verified(true)
                    .availabilityDays(List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"))
                    .createdAt(Instant.now())
                    .build();
            helperProfileRepository.save(profile);
        }
        return user;
    }
}
