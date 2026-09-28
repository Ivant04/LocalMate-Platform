package com.localmate.repository;

import com.localmate.model.HelperProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface HelperProfileRepository extends MongoRepository<HelperProfile, String> {
    Optional<HelperProfile> findByUserId(String userId);
    List<HelperProfile> findByCityIgnoreCase(String city);
    List<HelperProfile> findBySkillsContainingIgnoreCase(String skill);
    List<HelperProfile> findByVerifiedTrue();
}
