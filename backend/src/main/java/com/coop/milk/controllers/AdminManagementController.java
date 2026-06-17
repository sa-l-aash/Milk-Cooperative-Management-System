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

    @PostMapping("/provision-station")
    @Transactional
    public ResponseEntity<?> provisionCooperativeAndManager(@RequestBody Map<String, Object> payload) {
        try {
            // 1. Parse payload fields safely (County and Sub-County geographical parameters)
            String coopName = ((String) payload.get("coopName")).trim();
            String county = ((String) payload.get("county")).trim();
            String subCounty = ((String) payload.get("subCounty")).trim();
            String username = ((String) payload.get("managerUsername")).trim().toLowerCase();
            String password = ((String) payload.get("managerPassword")).trim(); // Sanitized trailing spaces

            // 2. ENFORCE SAFETY VALIDATION CHEERS (Case-Insensitive Constraints)
            // A. Check for duplicate cooperative name registries globally
            if (cooperativeRepository.findByNameIgnoreCase(coopName).isPresent()) {
                return ResponseEntity.badRequest().body("Error: A cooperative branch with the name '" + coopName + "' already exists inside the database system.");
            }

            // B. Check for duplicate manager account usernames globally
            if (userRepository.findByUsernameIgnoreCase(username).isPresent()) {
                return ResponseEntity.badRequest().body("Error: Manager username '" + username + "' is already registered in the system registry.");
            }

            // 3. Create and persist the Cooperative entity with localized branch identifiers
            Cooperative cooperative = new Cooperative();
            cooperative.setName(coopName);
            cooperative.setCounty(county);
            cooperative.setSubCounty(subCounty);
            
            // Baseline buying price initializes at zero; managers update it via dashboard authority
            cooperative.setBaseRatePerLiter(BigDecimal.ZERO);
            
            Cooperative savedCooperative = cooperativeRepository.save(cooperative);

            // 4. Instantiate the Manager account entity and bind the cooperative relationship
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
}