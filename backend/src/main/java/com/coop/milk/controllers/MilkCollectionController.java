package com.coop.milk.controllers;

import com.coop.milk.models.Cooperative;
import com.coop.milk.models.Farmer;
import com.coop.milk.models.MilkDelivery;
import com.coop.milk.models.User;
import com.coop.milk.repositories.FarmerRepository;
import com.coop.milk.repositories.MilkDeliveryRepository;
import com.coop.milk.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/collections")
@CrossOrigin(origins = "*")
public class MilkCollectionController {

    @Autowired
    private MilkDeliveryRepository milkDeliveryRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private UserRepository userRepository;

    // Endpoint to record a new milk intake entry scoped strictly within branch boundaries
    @PostMapping("/record")
    public ResponseEntity<?> recordMilkIntake(@RequestBody Map<String, Object> payload) {
        try {
            // 1. Extract and sanitize inputs cleanly from payload map variables
            String farmerNumber = ((String) payload.get("farmerNumber")).trim();
            Double quantityLiters = Double.parseDouble(payload.get("quantityLiters").toString());
            String sessionType = ((String) payload.get("sessionType")).trim();
            Long recordedByUserId = Long.parseLong(payload.get("recordedByUserId").toString());

            // 2. Query the operating manager profile context from database first
            User manager = userRepository.findById(recordedByUserId)
                    .orElseThrow(() -> new RuntimeException("Error: Operating manager context could not be validated."));

            // 3. Data Isolation Guardrail: Ensure the operator belongs to an active station branch
            Cooperative managerStation = manager.getCooperative();
            if (managerStation == null) {
                return ResponseEntity.badRequest().body("Error: Operating manager is not assigned to any cooperative cluster station.");
            }

            // 4. Scoped Query: Find the farmer matching the input code ONLY inside this manager's cooperative branch
            Farmer farmer = farmerRepository.findByFarmerNumberAndCooperative(farmerNumber, managerStation)
                    .orElseThrow(() -> new RuntimeException("Error: No farmer found with code '" + farmerNumber + "' within your cooperative branch."));

            // 5. Populate our persistent relational entry structure once cleared
            MilkDelivery delivery = new MilkDelivery();
            delivery.setFarmer(farmer);
            delivery.setDeliveryDate(LocalDate.now());
            delivery.setSessionType(sessionType.toUpperCase());
            delivery.setQuantityLiters(java.math.BigDecimal.valueOf(quantityLiters));
            
            // Inherit rates safely from the shared validated station parameters
            delivery.setPricePerLiter(managerStation.getBaseRatePerLiter());
            delivery.setRecordedByUserId(recordedByUserId);

            // Save entry to PostgreSQL storage tables
            MilkDelivery savedDelivery = milkDeliveryRepository.save(delivery);

            return ResponseEntity.ok("Intake recorded! Registered " + savedDelivery.getQuantityLiters() + 
                    " Liters for " + farmer.getFullName() + ".");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Collection logging rejected: " + e.getMessage());
        }
    }

    // Endpoint for a farmer or manager to see history records
    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<MilkDelivery>> getFarmerDeliveryHistory(@PathVariable Long farmerId) {
        return ResponseEntity.ok(milkDeliveryRepository.findByFarmerFarmerId(farmerId));
    }

    // =========================================================================
    // 💡 NEW: Endpoint explicitly built for the Analytics Graph
    // =========================================================================
    @GetMapping("/farmer/{farmerNumber}/analytics")
    public ResponseEntity<?> getFarmerAnalytics(@PathVariable String farmerNumber) {
        try {
            // Spring Boot parses "findByFarmer_FarmerNumber..." to look inside the Farmer table!
            List<MilkDelivery> records = milkDeliveryRepository.findByFarmer_FarmerNumberOrderByDeliveryDateAsc(farmerNumber);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to fetch analytics: " + e.getMessage());
        }
    }
}