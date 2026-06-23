package com.coop.milk.repositories;

import com.coop.milk.models.MilkDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MilkDeliveryRepository extends JpaRepository<MilkDelivery, Long> {
    
    // Custom query to find all milk deliveries for a specific farmer profile using internal ID
    List<MilkDelivery> findByFarmerFarmerId(Long farmerId);

    // 💡 NEW: Custom query for the Analytics Graph using the Farmer Number, sorted by date!
    List<MilkDelivery> findByFarmer_FarmerNumberOrderByDeliveryDateAsc(String farmerNumber);
}