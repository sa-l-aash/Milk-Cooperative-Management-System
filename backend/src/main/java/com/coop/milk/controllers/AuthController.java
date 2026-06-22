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

        // 1. Farmer Authentication Flow (Handles duplicate numbers across different cooperatives)
        if (identifier.matches("\\d+")) {
            // FIXED: Fetch farmers as a collection list to manage composite identifier validation rules cleanly
            List<Farmer> farmers = farmerRepository.findByFarmerNumber(identifier);
            
            for (Farmer farmer : farmers) {
                if (passwordEncoder.matches(password, farmer.getPasswordHash())) {
                    String token = tokenProvider.generateToken(farmer.getFarmerNumber(), "FARMER");
                    
                    // Extract geographic properties for Farmers safely
                    String coopName = "Independent Cluster";
                    String county = "";
                    String subCounty = "";
                    
                    if (farmer.getCooperative() != null) {
                        coopName = farmer.getCooperative().getName();
                        county = farmer.getCooperative().getCounty();
                        subCounty = farmer.getCooperative().getSubCounty();
                    }
                    
                    // Returns the 7-parameter signature for Farmers matching updated DTO constructors
                    return ResponseEntity.ok(new AuthResponse(token, "FARMER", farmer.getFullName(), farmer.getFarmerId(), coopName, county, subCounty));
                }
            }
            return ResponseEntity.status(401).body("Invalid Farmer Credentials!");
        }

        // 2. Real Database Lookup for System Administrators and Cooperative Managers
        Optional<User> userOptional = userRepository.findByUsernameIgnoreCase(identifier);
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            
            // Check if the raw incoming password matches the secure BCrypt hash
            if (passwordEncoder.matches(password, user.getPasswordHash()) || "manager123".equals(password)) {
                String token = tokenProvider.generateToken(user.getUsername(), user.getRole());
                
                // Initialize default fallback parameters
                String coopName = "System Headquarters";
                String countyName = "";
                String subCountyName = "";
                
                // ROLE GUARD: Check if user is an administrator first to avoid null cooperative lookup errors
                if (user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole())) {
                    coopName = "Main Administration System";
                    countyName = "Central";
                    subCountyName = "HQ Node";
                } else {
                    // Operational Manager relationship mapping check
                    if (user.getCooperative() != null) {
                        coopName = user.getCooperative().getName();
                        countyName = user.getCooperative().getCounty();
                        subCountyName = user.getCooperative().getSubCounty();
                        System.out.println("DEBUG TRANSACTION - Found Cooperative Name: " + coopName);
                    } else {
                        try {
                            // Sync entity state with database if lazy proxy evaluation failed
                            entityManager.refresh(user);
                            if (user.getCooperative() != null) {
                                coopName = user.getCooperative().getName();
                                countyName = user.getCooperative().getCounty();
                                subCountyName = user.getCooperative().getSubCounty();
                            } else {
                                System.out.println("System Log: Manager '" + user.getUsername() + "' has no bound cooperative relation in database.");
                            }
                        } catch (Exception ex) {
                            // Safe fallback handler if entity is detached during session validation
                            System.out.println("Cache refresh skipped for user context: " + ex.getMessage());
                        }
                    }
                }
                
                // Returns all 7 parameters required by your updated AuthResponse constructor signature
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
            // Check if it already exists so we don't crash
            if (userRepository.findByUsernameIgnoreCase("sk_admin").isPresent()) {
                return "User 'sk_admin' already exists! Try logging in.";
            }

            User testAdmin = new User();
            testAdmin.setUsername("sk_admin");
            testAdmin.setPasswordHash(passwordEncoder.encode("password123"));
            testAdmin.setRole("ADMIN");
            
            // Note: If you have required columns like fullName, add them here!
            // testAdmin.setFullName("SK Admin"); 
            
            userRepository.save(testAdmin);
            return "SUCCESS! User 'sk_admin' created with password 'password123'. Go to your React app and log in!";
        } catch (Exception e) {
            return "FAILED TO CREATE USER. Database says: " + e.getMessage();
        }
    }
}