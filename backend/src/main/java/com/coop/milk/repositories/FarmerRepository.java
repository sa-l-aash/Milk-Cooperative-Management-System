package com.coop.milk.repositories;

import com.coop.milk.models.Cooperative;
import com.coop.milk.models.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface FarmerRepository extends JpaRepository<Farmer, Long> {
// Look up a unique farmer code inside a specific cooperative station boundary
    Optional<Farmer> findByFarmerNumberAndCooperative(String farmerNumber, Cooperative cooperative);
    
    // Global list lookup to route mobile logins matching shared numeric sequences
    List<Farmer> findByFarmerNumber(String farmerNumber);
    
    // For search bars filtering profiles by name
    List<Farmer> findByFullNameContainingIgnoreCase(String fullName);

    // 💡 ADD THIS LINE TO FIX THE COMPILER ERROR
    List<Farmer> findByCooperative(Cooperative cooperative);
    
    long countByCooperative(com.coop.milk.models.Cooperative cooperative);
}