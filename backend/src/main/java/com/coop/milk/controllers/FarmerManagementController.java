package com.coop.milk.controllers;

import com.coop.milk.models.Cooperative;
import com.coop.milk.models.Farmer;
import com.coop.milk.models.User;
import com.coop.milk.repositories.FarmerRepository;
import com.coop.milk.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
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
            // Extract and sanitize raw fields from incoming payload map
            String farmerNumber = ((String) payload.get("farmerNumber")).trim();
            String fullName = ((String) payload.get("fullName")).trim();
            String phoneNumber = ((String) payload.get("phoneNumber")).trim();
            String password = ((String) payload.get("password")).trim();
            String managerUsername = ((String) payload.get("managerUsername")).trim(); 

            // Look up the operating manager who is dispatching this onboarding transaction
            User manager = userRepository.findByUsernameIgnoreCase(managerUsername)
                    .orElseThrow(() -> new RuntimeException("Operating manager account context could not be resolved."));

            // Verify that this operating manager is explicitly bound to a valid cooperative station
            Cooperative managerStation = manager.getCooperative();
            if (managerStation == null) {
                return ResponseEntity.badRequest().body("Error: Operating manager is not assigned to any cooperative cluster station.");
            }

            // ==================== STEP 4 PLACEMENT (VERIFIED) ====================
            // COMPOSITE SAFETY GUARD: Checks for duplicate numbers ONLY within this specific cooperative branch
            if (farmerRepository.findByFarmerNumberAndCooperative(farmerNumber, managerStation).isPresent()) {
                return ResponseEntity.badRequest().body("Error: A profile with Farmer Number " + farmerNumber + " already exists within your cooperative branch!");
            }
            // =====================================================================

            // Create the new Farmer object layout
            Farmer farmer = new Farmer();
            farmer.setFarmerNumber(farmerNumber);
            farmer.setFullName(fullName);
            farmer.setPhoneNumber(phoneNumber);
            
            // AUTOMATIC BINDING: Assign the manager's cooperative entity directly to the new producer row
            farmer.setCooperative(managerStation);
            
            // Hash the incoming password string securely inside Java before writing to the database
            String secureHash = passwordEncoder.encode(password);
            farmer.setPasswordHash(secureHash);

            // Commit the transaction to the database table
            Farmer savedFarmer = farmerRepository.save(farmer);

            return ResponseEntity.ok("Farmer profile for " + savedFarmer.getFullName() + " registered successfully under ID: " + savedFarmer.getFarmerId() + " bound to " + managerStation.getName());
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Onboarding process failed: " + e.getMessage());
        }
    }

    // 2. FIXED: Endpoint to fetch an isolated list of active registered farmers SPECIFIC to the manager's cooperative station
    @GetMapping("/list")
    public ResponseEntity<?> getFarmersByManagerCooperative(@RequestParam String managerUsername) {
        try {
            User manager = userRepository.findByUsernameIgnoreCase(managerUsername.trim())
                    .orElseThrow(() -> new RuntimeException("Manager context profile could not be verified."));

            Cooperative managerStation = manager.getCooperative();
            if (managerStation == null) {
                return ResponseEntity.badRequest().body("Error: Current operator has no cooperative assignment.");
            }

            // Scoped fetch matching ONLY the manager's cooperative branch node
            List<Farmer> farmers = farmerRepository.findByCooperative(managerStation);
            return ResponseEntity.ok(farmers);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to retrieve scoped farmer log records: " + e.getMessage());
        }
    }
}