package com.coop.milk.models;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(
    name = "farmers",
    uniqueConstraints = {
        // COMPOSITE INDEX FIX: Enforces uniqueness only for numbers within a specific cooperative branch ecosystem
        @UniqueConstraint(name = "uk_farmer_per_cooperative", columnNames = {"farmer_number", "cooperative_id"})
    }
)
public class Farmer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "farmer_id")
    private Long farmerId;

    @ManyToOne(fetch = FetchType.EAGER) // SHIFTED TO EAGER: Avoids LazyInitializationException anomalies on session logs
    @JoinColumn(name = "cooperative_id", nullable = false)
    private Cooperative cooperative;

    // REMOVED unique = true from column configurations block layout
    @Column(name = "farmer_number", nullable = false, length = 30)
    private String farmerNumber; // Unique username/ID for mobile login per station

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "phone_number", nullable = false, length = 15)
    private String phoneNumber; // Target for future SMS collection alerts

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "created_at", insertable = false, updatable = false)
    private ZonedDateTime createdAt;

    // 💡 CRITICAL CASCADE FIX: Wipes out all matching history rows automatically when a farmer is dropped
    @OneToMany(mappedBy = "farmer", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore // Prevents infinite recursion loops during serialization sweeps
    private List<MilkDelivery> collections;

    // Getters and Setters
    public Long getFarmerId() { return farmerId; }
    public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }

    public Cooperative getCooperative() { return cooperative; }
    public void setCooperative(Cooperative cooperative) { this.cooperative = cooperative; }

    public String getFarmerNumber() { return farmerNumber; }
    public void setFarmerNumber(String farmerNumber) { this.farmerNumber = farmerNumber; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public List<MilkDelivery> getCollections() { return collections; }
    public void setCollections(List<MilkDelivery> collections) { this.collections = collections; }
}