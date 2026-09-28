package com.localmate.repository;

import com.localmate.model.PaymentTransaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends MongoRepository<PaymentTransaction, String> {
    List<PaymentTransaction> findByTravelerId(String travelerId);
    Optional<PaymentTransaction> findByBookingId(String bookingId);
    Optional<PaymentTransaction> findByTransactionRef(String transactionRef);
}
