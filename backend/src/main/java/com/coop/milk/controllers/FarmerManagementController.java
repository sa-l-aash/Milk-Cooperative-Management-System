package com.coop.milk.controllers;

import com.coop.milk.models.Cooperative;
import com.coop.milk.models.Farmer;
import com.coop.milk.models.User;
import com.coop.milk.repositories.FarmerRepository;
import com.coop.milk.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/managers/farmers")
@CrossOrigin(origins = "*")
public class FarmerManagementController {

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // 1. Endpoint for Cooperative Managers to register a new farmer profile automatically bound to their station
    @PostMapping("/register")
    public ResponseEntity<?> registerFarmer(@RequestBody Map<String, Object> payload) {
        try {
            String farmerNumber = ((String) payload.get("farmerNumber")).trim();
            String fullName = ((String) payload.get("fullName")).trim();
            String phoneNumber = ((String) payload.get("phoneNumber")).trim();
            String password = ((String) payload.get("password")).trim();
            String managerUsername = ((String) payload.get("managerUsername")).trim(); 

            User manager = userRepository.findByUsernameIgnoreCase(managerUsername)
                    .orElseThrow(() -> new RuntimeException("Operating manager account context could not be resolved."));

            Cooperative managerStation = manager.getCooperative();
            if (managerStation == null) {
                return ResponseEntity.badRequest().body("Error: Operating manager is not assigned to any cooperative cluster station.");
            }

            if (farmerRepository.findByFarmerNumberAndCooperative(farmerNumber, managerStation).isPresent()) {
                return ResponseEntity.badRequest().body("Error: A profile with Farmer Number " + farmerNumber + " already exists within your cooperative branch!");
            }

            Farmer farmer = new Farmer();
            farmer.setFarmerNumber(farmerNumber);
            farmer.setFullName(fullName);
            farmer.setPhoneNumber(phoneNumber);
            farmer.setCooperative(managerStation);
            
            String secureHash = passwordEncoder.encode(password);
            farmer.setPasswordHash(secureHash);

            Farmer savedFarmer = farmerRepository.save(farmer);

            return ResponseEntity.ok("Farmer profile for " + savedFarmer.getFullName() + " registered successfully under ID: " + savedFarmer.getFarmerId() + " bound to " + managerStation.getName());
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Onboarding process failed: " + e.getMessage());
        }
    }

    // 2. Endpoint to fetch an isolated list of active registered farmers SPECIFIC to the manager's cooperative station
    @GetMapping("/list")
    public ResponseEntity<?> getFarmersByManagerCooperative(@RequestParam String managerUsername) {
        try {
            User manager = userRepository.findByUsernameIgnoreCase(managerUsername.trim())
                    .orElseThrow(() -> new RuntimeException("Manager context profile could not be verified."));

            Cooperative managerStation = manager.getCooperative();
            if (managerStation == null) {
                return ResponseEntity.badRequest().body("Error: Current operator has no cooperative assignment.");
            }

            List<Farmer> farmers = farmerRepository.findByCooperative(managerStation);
            return ResponseEntity.ok(farmers);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to retrieve scoped farmer log records: " + e.getMessage());
        }
    }

    // =======================================================================================
    // 💡 UPGRADED: SECURE INLINE EDIT METHOD (Handles both Name and Phone)
    // =======================================================================================

    // 3. Endpoint to securely update a farmer's full name and phone number
    @PutMapping("/update")
    @Transactional
    public ResponseEntity<?> updateFarmerDetails(@RequestBody Map<String, Object> payload) {
        try {
            // Safely extract variables from the React JSON payload to prevent NullPointerExceptions
            String farmerNumber = payload.getOrDefault("farmerNumber", "").toString().trim();
            String fullName = payload.getOrDefault("fullName", "").toString().trim();
            String phoneNumber = payload.getOrDefault("phoneNumber", "").toString().trim();
            String managerUsername = payload.getOrDefault("managerUsername", "").toString().trim();

            // Validate that the manager didn't accidentally delete the data leaving it blank
            if (farmerNumber.isEmpty() || fullName.isEmpty() || phoneNumber.isEmpty()) {
                return ResponseEntity.badRequest().body("Error: Farmer Number, Full Name, and Phone Number cannot be empty.");
            }

            // Authenticate the manager and grab their assigned cooperative branch
            User manager = userRepository.findByUsernameIgnoreCase(managerUsername)
                    .orElseThrow(() -> new RuntimeException("Manager authorization failed."));
            
            Cooperative coop = manager.getCooperative();

            // Find the specific farmer inside THIS cooperative (so managers can't edit other branches' farmers)
            Farmer farmer = farmerRepository.findByFarmerNumberAndCooperative(farmerNumber, coop)
                    .orElseThrow(() -> new RuntimeException("Farmer #" + farmerNumber + " not found in your cooperative."));

            // Apply the modifications
            farmer.setFullName(fullName);
            farmer.setPhoneNumber(phoneNumber);

            // Save the newly updated farmer back to PostgreSQL
            farmerRepository.save(farmer);

            return ResponseEntity.ok("Farmer records modified successfully.");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update farmer record: " + e.getMessage());
        }
    }

    // 4. Endpoint to safely drop a farmer profile from the cooperative network
    @DeleteMapping("/{farmerNumber}")
    public ResponseEntity<?> deleteFarmer(@PathVariable String farmerNumber, @RequestParam String managerUsername) {
        try {
            User manager = userRepository.findByUsernameIgnoreCase(managerUsername.trim())
                    .orElseThrow(() -> new RuntimeException("Operating manager account context could not be resolved."));

            Cooperative managerStation = manager.getCooperative();
            if (managerStation == null) {
                return ResponseEntity.badRequest().body("Error: Manager is not assigned to a cooperative.");
            }

            // Ensure the manager can only delete farmers within their own cooperative domain
            Farmer farmer = farmerRepository.findByFarmerNumberAndCooperative(farmerNumber, managerStation)
                    .orElseThrow(() -> new RuntimeException("Farmer #" + farmerNumber + " not found in your cooperative branch."));

            // Execute the permanent drop
            farmerRepository.delete(farmer);

            return ResponseEntity.ok("Farmer profile #" + farmerNumber + " has been permanently removed.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to execute deletion protocol: " + e.getMessage());
        }
    }
}