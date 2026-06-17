package com.coop.milk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class MilkCooperativeApplication {

    public static void main(String[] args) {
        SpringApplication.run(MilkCooperativeApplication.class, args);
    }

    // A temporary health-check endpoint to verify our server is alive
    @GetMapping("/api/v1/health")
    public String healthCheck() {
        return "MILK COOPERATIVE MANAGEMENT SYSTEM Backend is Running Successfully!";
    }
}