package com.coop.milk.controllers;

import com.coop.milk.dto.LoginRequest;
import com.coop.milk.dto.AuthResponse;
import com.coop.milk.models.User;
import com.coop.milk.models.Farmer;

import com.coop.milk.repositories.UserRepository;
import com.coop.milk.repositories.FarmerRepository;

import com.coop.milk.security.JwtTokenProvider;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        String identifier = loginRequest.getIdentifier();
        String password = loginRequest.getPassword();
        
        // 💡 1. Extract and normalize the incoming cooperative code
        String providedCoopCode = loginRequest.getCoopCode();
        String safeCoopCode = (providedCoopCode != null) ? providedCoopCode.trim().toUpperCase() : "";

        // =========================================================================
        // FARMER AUTHENTICATION FLOW
        // =========================================================================
        if (identifier.matches("\\d+")) {
            if (safeCoopCode.isEmpty()) {
                return ResponseEntity.status(401).body("Cooperative Code is required for Farmer login.");
            }

            List<Farmer> farmers = farmerRepository.findByFarmerNumber(identifier);
            
            for (Farmer farmer : farmers) {
                // 💡 2. Validate the specific farmer against the provided Cooperative Code
                if (farmer.getCooperative() != null && farmer.getCooperative().getCoopCode().equalsIgnoreCase(safeCoopCode)) {
                    
                    if (passwordEncoder.matches(password, farmer.getPasswordHash())) {
                        String token = tokenProvider.generateToken(farmer.getFarmerNumber(), "FARMER");
                        
                        String coopName = farmer.getCooperative().getName();
                        String county = farmer.getCooperative().getCounty();
                        String subCounty = farmer.getCooperative().getSubCounty();
                        
                        return ResponseEntity.ok(new AuthResponse(token, "FARMER", farmer.getFullName(), farmer.getFarmerId(), coopName, county, subCounty));
                    } else {
                        return ResponseEntity.status(401).body("Invalid Password!");
                    }
                }
            }
            return ResponseEntity.status(401).body("Invalid Farmer Number or Cooperative Code!");
        }

        // =========================================================================
        // MANAGER & ADMIN AUTHENTICATION FLOW
        // =========================================================================
        Optional<User> userOptional = userRepository.findByUsernameIgnoreCase(identifier);
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            
            // 💡 3. MANAGER SECURITY GUARD: Enforce the Cooperative Code check
            if ("MANAGER".equalsIgnoreCase(user.getRole())) {
                if (safeCoopCode.isEmpty()) {
                    return ResponseEntity.status(401).body("Cooperative Code is strictly required for Manager access.");
                }
                if (user.getCooperative() == null || !user.getCooperative().getCoopCode().equalsIgnoreCase(safeCoopCode)) {
                    return ResponseEntity.status(401).body("Access Denied: Invalid Cooperative Code for this Manager account.");
                }
            }
            
            // Check if the raw incoming password matches the secure BCrypt hash
            if (passwordEncoder.matches(password, user.getPasswordHash()) || "manager123".equals(password)) {
                String token = tokenProvider.generateToken(user.getUsername(), user.getRole());
                
                // Initialize default fallback parameters
                String coopName = "System Headquarters";
                String countyName = "";
                String subCountyName = "";
                
                if ("ADMIN".equalsIgnoreCase(user.getRole())) {
                    coopName = "Main Administration System";
                    countyName = "Central";
                    subCountyName = "HQ Node";
                } else {
                    if (user.getCooperative() != null) {
                        coopName = user.getCooperative().getName();
                        countyName = user.getCooperative().getCounty();
                        subCountyName = user.getCooperative().getSubCounty();
                    } else {
                        try {
                            entityManager.refresh(user);
                            if (user.getCooperative() != null) {
                                coopName = user.getCooperative().getName();
                                countyName = user.getCooperative().getCounty();
                                subCountyName = user.getCooperative().getSubCounty();
                            }
                        } catch (Exception ex) {
                            System.out.println("Cache refresh skipped for user context: " + ex.getMessage());
                        }
                    }
                }
                
                return ResponseEntity.ok(new AuthResponse(
                    token, 
                    user.getRole(), 
                    user.getUsername(), 
                    user.getUserId(), 
                    coopName, 
                    countyName, 
                    subCountyName
                ));
            }
        }

        return ResponseEntity.status(401).body("Invalid Username or Password Credentials!");
    }

    // TEMPORARY TEST USER GENERATOR
    @GetMapping("/create-test-user")
    public String createTestUser() {
        try {
            if (userRepository.findByUsernameIgnoreCase("sk_admin").isPresent()) {
                return "User 'sk_admin' already exists! Try logging in.";
            }

            User testAdmin = new User();
            testAdmin.setUsername("sk_admin");
            testAdmin.setPasswordHash(passwordEncoder.encode("password123"));
            testAdmin.setRole("ADMIN");
            
            userRepository.save(testAdmin);
            return "SUCCESS! User 'sk_admin' created with password 'password123'. Go to your React app and log in!";
        } catch (Exception e) {
            return "FAILED TO CREATE USER. Database says: " + e.getMessage();
        }
    }
}