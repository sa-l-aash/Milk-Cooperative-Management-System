package com.coop.milk.controllers;

import com.coop.milk.models.MonthlyStatement;
import com.coop.milk.repositories.MonthlyStatementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/statements")
@CrossOrigin(origins = "*") // Forces the CORS firewall completely open for this route
public class StatementController {

    @Autowired
    private MonthlyStatementRepository repository;

    // =========================================================================
    // 1. THE FARMER ENDPOINT (Fetches statements for a specific farmer)
    // =========================================================================
    @GetMapping("/farmer/{farmerNumber}")
    public ResponseEntity<?> getFarmerStatements(@PathVariable String farmerNumber) {
        try {
            System.out.println("🚨 FETCHING STATEMENTS FOR FARMER: " + farmerNumber);
            
            // Relies on your custom repository method to fetch and sort by generated date
            List<MonthlyStatement> statements = repository.findByFarmerNumberOrderByGeneratedAtDesc(farmerNumber);
            
            System.out.println("✅ SUCCESS! FOUND " + statements.size() + " STATEMENTS.");
            return ResponseEntity.ok(statements);
            
        } catch (Exception e) {
            System.out.println("❌ FATAL CRASH IN STATEMENT CONTROLLER: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching farmer statements.");
        }
    }

    // =========================================================================
    // 2. THE MANAGER ENDPOINT (Fetches master cooperative ledgers)
    // =========================================================================
    @GetMapping("/manager/{managerUsername}")
    public ResponseEntity<?> getManagerStatements(@PathVariable String managerUsername) {
        try {
            System.out.println("🚨 FETCHING STATEMENTS FOR MANAGER: " + managerUsername);
            
            List<MonthlyStatement> allStatements = repository.findAll();
            
            List<MonthlyStatement> managerStatements = allStatements.stream()
                .filter(stmt -> managerUsername.equals(stmt.getManagerUsername()) || "SYSTEM_AUTO".equals(stmt.getManagerUsername())) 
                // 🚨 THE CRITICAL FIX: We sort by ID descending. It achieves exact chronological sorting without NullPointerExceptions!
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .collect(Collectors.toList());

            System.out.println("✅ SUCCESS! FOUND " + managerStatements.size() + " STATEMENTS FOR COOP.");
            return ResponseEntity.ok(managerStatements);
            
        } catch (Exception e) {
            System.out.println("❌ FATAL CRASH IN STATEMENT CONTROLLER: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching manager statements.");
        }
    }
}