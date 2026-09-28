package com.localmate.repository;

import com.localmate.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByTravelerId(String travelerId);
    List<Booking> findByHelperId(String helperId);
    List<Booking> findByHelperIdAndStatus(String helperId, String status);
    List<Booking> findByTravelerIdAndStatus(String travelerId, String status);
}
