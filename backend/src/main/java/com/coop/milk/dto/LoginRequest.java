package com.coop.milk.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank(message = "Identifier is required")
    private String identifier; // This will hold a username OR a farmer_number

    @NotBlank(message = "Password is required")
    private String password;

    // 💡 NEW: Catches the Cooperative Code (Intentionally not @NotBlank so Admins can bypass it)
    private String coopCode; 

    // Getters and Setters
    public String getIdentifier() { return identifier; }
    public void setIdentifier(String identifier) { this.identifier = identifier; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getCoopCode() { return coopCode; } // 💡 NEW GETTER
    public void setCoopCode(String coopCode) { this.coopCode = coopCode; } // 💡 NEW SETTER
}