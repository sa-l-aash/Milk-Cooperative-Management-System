package com.coop.milk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FarmerRegistrationRequest {

    @NotNull(message = "Cooperative ID is required")
    private Long cooperativeId;

    @NotBlank(message = "Farmer number identifier is required")
    private String farmerNumber;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Default login password is required")
    private String password;

    // Getters and Setters
    public Long getCooperativeId() { return cooperativeId; }
    public void setCooperativeId(Long cooperativeId) { this.cooperativeId = cooperativeId; }

    public String getFarmerNumber() { return farmerNumber; }
    public void setFarmerNumber(String farmerNumber) { this.farmerNumber = farmerNumber; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}