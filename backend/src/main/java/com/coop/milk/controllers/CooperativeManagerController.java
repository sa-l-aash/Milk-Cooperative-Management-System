package com.coop.milk.controllers;

import com.coop.milk.models.Cooperative;
import com.coop.milk.models.User;
import com.coop.milk.repositories.CooperativeRepository;
import com.coop.milk.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/managers/cooperative")
@CrossOrigin(origins = "*")
public class CooperativeManagerController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CooperativeRepository cooperativeRepository;

    // 1. Fetch current operating buying rate for the manager's station context
    @GetMapping("/rate")
    public ResponseEntity<?> getStationRate(@RequestParam String managerUsername) {
        User manager = userRepository.findByUsernameIgnoreCase(managerUsername)
                .orElseThrow(() -> new RuntimeException("Operational context invalid."));

        if (manager.getCooperative() == null) {
            return ResponseEntity.badRequest().body("Error: Operator is not assigned to any cooperative station.");
        }

        return ResponseEntity.ok(manager.getCooperative());
    }

    // 2. Modify base buying rate matrix dynamically by assigned manager
    @PutMapping("/rate")
    @Transactional
    public ResponseEntity<?> updateStationRate(@RequestBody Map<String, Object> payload) {
        try {
            String username = (String) payload.get("managerUsername");
            BigDecimal newRate = new BigDecimal(payload.get("newRate").toString());

            if (newRate.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body("Error: Buying rate metrics must evaluate to positive values.");
            }

            User manager = userRepository.findByUsernameIgnoreCase(username)
                    .orElseThrow(() -> new RuntimeException("Authorized session row could not be validated."));

            if (manager.getCooperative() == null) {
                return ResponseEntity.badRequest().body("Error: Operating user lacks system administrative authority over a station cluster.");
            }

            Cooperative station = manager.getCooperative();
            station.setBaseRatePerLiter(newRate);
            cooperativeRepository.save(station);

            return ResponseEntity.ok("Station purchasing baseline index committed cleanly at KSH " + newRate);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to commit pricing modifications: " + e.getMessage());
        }
    }
}