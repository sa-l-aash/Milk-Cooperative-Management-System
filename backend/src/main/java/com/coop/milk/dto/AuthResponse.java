package com.coop.milk.dto;

public class AuthResponse {
    private String token;
    private String role;
    private String identifier;
    private Long userId; 
    private String cooperativeName; 
    private String county;      // ADDED: For geographic identity
    private String subCounty;   // ADDED: For branch distinction

    // Comprehensive Constructor
    public AuthResponse(String token, String role, String identifier, Long userId, String cooperativeName, String county, String subCounty) {
        this.token = token;
        this.role = role;
        this.identifier = identifier;
        this.userId = userId;
        this.cooperativeName = cooperativeName; // FIXED: Assigned incoming argument to class field
        this.county = county;                   // ADDED
        this.subCounty = subCounty;             // ADDED
    }

    // Getters
    public String getToken() { return token; }
    public String getRole() { return role; }
    public String getIdentifier() { return identifier; }
    public Long getUserId() { return userId; } 
    public String getCooperativeName() { return cooperativeName; }
    public String getCounty() { return county; }         // ADDED
    public String getSubCounty() { return subCounty; }   // ADDED
}