package com.coop.milk.controllers;

import com.coop.milk.models.Cooperative;
import com.coop.milk.models.User;
import com.coop.milk.repositories.CooperativeRepository;
import com.coop.milk.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "*")
public class AdminManagementController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CooperativeRepository cooperativeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.coop.milk.repositories.FarmerRepository farmerRepository;

    // 1. Endpoint to fetch the full directory of cooperatives for the Admin Dashboard
    @GetMapping("/cooperatives")
    public org.springframework.http.ResponseEntity<?> getAllCooperatives() {
        try {
            java.util.List<com.coop.milk.models.Cooperative> cooperatives = cooperativeRepository.findAll();
            
            // Map the raw database entities into our clean DTO for React
            java.util.List<com.coop.milk.dto.CooperativeAdminDTO> directory = cooperatives.stream().map(coop -> {
                
                // Count the farmers belonging to this specific cooperative
                long farmerCount = farmerRepository.countByCooperative(coop);
                
                // Find the manager assigned to this cooperative (if any)
                String managerName = userRepository.findFirstByCooperative(coop)
                        .map(com.coop.milk.models.User::getUsername)
                        .orElse("Unassigned");

                // Package it all up
                return new com.coop.milk.dto.CooperativeAdminDTO(
                        coop.getCooperativeId(),
                        coop.getName(),
                        coop.getCounty(),
                        coop.getSubCounty(),
                        managerName,
                        farmerCount,
                        coop.getBaseRatePerLiter(),
                        coop.getTimestamp()
                );
            }).collect(java.util.stream.Collectors.toList());

            return org.springframework.http.ResponseEntity.ok(directory);

        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body("Failed to fetch cooperative directory: " + e.getMessage());
        }
    }

    // 2. Endpoint to provision a new physical station and bind its manager
    // 💡 FIXED: Moved the correct routing annotations down to the correct method!
    @PostMapping("/provision-station")
    @Transactional
    public ResponseEntity<?> provisionCooperativeAndManager(@RequestBody Map<String, Object> payload) {
        try {
            // Parse payload fields safely (County and Sub-County geographical parameters)
            String coopName = ((String) payload.get("coopName")).trim();
            String county = ((String) payload.get("county")).trim();
            String subCounty = ((String) payload.get("subCounty")).trim();
            String username = ((String) payload.get("managerUsername")).trim().toLowerCase();
            String password = ((String) payload.get("managerPassword")).trim(); // Sanitized trailing spaces

            // ENFORCE SAFETY VALIDATION CHEERS (Case-Insensitive Constraints)
            // A. Check for duplicate cooperative name registries globally
            if (cooperativeRepository.findByNameIgnoreCase(coopName).isPresent()) {
                return ResponseEntity.badRequest().body("Error: A cooperative branch with the name '" + coopName + "' already exists inside the database system.");
            }

            // B. Check for duplicate manager account usernames globally
            if (userRepository.findByUsernameIgnoreCase(username).isPresent()) {
                return ResponseEntity.badRequest().body("Error: Manager username '" + username + "' is already registered in the system registry.");
            }

            // Create and persist the Cooperative entity with localized branch identifiers
            Cooperative cooperative = new Cooperative();
            cooperative.setName(coopName);
            cooperative.setCounty(county);
            cooperative.setSubCounty(subCounty);
            
            // Baseline buying price initializes at zero; managers update it via dashboard authority
            cooperative.setBaseRatePerLiter(BigDecimal.ZERO);
            
            Cooperative savedCooperative = cooperativeRepository.save(cooperative);

            // Instantiate the Manager account entity and bind the cooperative relationship
            User manager = new User();
            manager.setUsername(username);
            manager.setRole("MANAGER");
            manager.setPasswordHash(passwordEncoder.encode(password));
            manager.setCooperative(savedCooperative);

            userRepository.save(manager);

            return ResponseEntity.ok("Successfully deployed " + coopName + " branch at " + 
                    subCounty + " Sub-County, " + county + " County. Assigned station manager: " + username);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Infrastructure provisioning failed: " + e.getMessage());
        }
    }
    // =======================================================================================
    // 💡 NEW ENDPOINTS: EDIT AND DELETE COOPERATIVES
    // =======================================================================================

    // 3. Endpoint to modify an existing cooperative's details
 // 3. Endpoint to modify an existing cooperative's details AND the Manager's Username
   // 3. Endpoint to modify an existing cooperative's details AND the Manager's Username
    @PutMapping("/cooperatives/{id}")
    @Transactional
    public ResponseEntity<?> updateCooperative(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Cooperative coop = cooperativeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Cooperative not found."));

            // 💡 Safely parse fields to prevent NullPointerExceptions
            String newName = payload.getOrDefault("name", "").toString().trim();
            String newCounty = payload.getOrDefault("county", "").toString().trim();
            String newSubCounty = payload.getOrDefault("subCounty", "").toString().trim();
            String newManagerName = payload.getOrDefault("managerName", "").toString().trim();

            if (newName.isEmpty() || newCounty.isEmpty() || newSubCounty.isEmpty()) {
                throw new RuntimeException("Cooperative name, county, and sub-county cannot be empty.");
            }

            // Update Cooperative details
            coop.setName(newName);
            coop.setCounty(newCounty);
            coop.setSubCounty(newSubCounty);
            cooperativeRepository.save(coop);

            // Safely update the Manager's Username Account if provided
            if (!newManagerName.isEmpty() && !newManagerName.equals("Unassigned")) {
                userRepository.findFirstByCooperative(coop).ifPresent(manager -> {
                    if (!manager.getUsername().equalsIgnoreCase(newManagerName)) {
                        // Safety check: Ensure the new username isn't already taken by someone else
                        if (userRepository.findByUsernameIgnoreCase(newManagerName).isPresent()) {
                            throw new RuntimeException("The username '" + newManagerName + "' is already taken.");
                        }
                        manager.setUsername(newManagerName);
                        userRepository.save(manager);
                    }
                });
            }

            return ResponseEntity.ok("Cooperative and Manager details updated successfully.");
        } catch (Exception e) {
            // This is what returns the 400 Bad Request to React!
            return ResponseEntity.badRequest().body("Update failed: " + e.getMessage());
        }
    }// 4. Endpoint to safely delete a cooperative AND its connected data
    @DeleteMapping("/cooperatives/{id}")
    @Transactional
    public ResponseEntity<?> deleteCooperative(@PathVariable Long id) {
        try {
            Cooperative coop = cooperativeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Cooperative not found."));

            // 💡 SAFETY CLEANUP: Prevent SQL Foreign Key Crash by deleting connected farmers first
            farmerRepository.findByCooperative(coop).forEach(farmer -> farmerRepository.delete(farmer));

            // Delete the manager connected to this station
            userRepository.findFirstByCooperative(coop).ifPresent(manager -> userRepository.delete(manager));

            // Finally, delete the cooperative itself
            cooperativeRepository.delete(coop);

            return ResponseEntity.ok("Cooperative and all associated records permanently deleted.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Deletion failed: " + e.getMessage());
        }
    }
}