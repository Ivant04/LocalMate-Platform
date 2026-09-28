package com.localmate.repository;

import com.localmate.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByHelperId(String helperId);
    List<Review> findByHelperIdOrderByCreatedAtDesc(String helperId);
    List<Review> findByBookingId(String bookingId);
    Optional<Review> findFirstByBookingId(String bookingId);
    boolean existsByBookingId(String bookingId);
    List<Review> findByTravelerIdOrderByCreatedAtDesc(String travelerId);
}
