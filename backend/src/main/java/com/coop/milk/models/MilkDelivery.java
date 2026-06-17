package com.coop.milk.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

@Entity
@Table(name = "milk_deliveries")
public class MilkDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "delivery_id")
    private Long deliveryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;
@Column(name = "recorded_by_user_id", nullable = false)
private Long recordedByUserId;
    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    @Column(name = "session_type", nullable = false, length = 10)
    private String sessionType; // "MORNING" or "EVENING"

    @Column(name = "quantity_liters", nullable = false, precision = 6, scale = 2)
    private BigDecimal quantityLiters;

    @Column(name = "price_per_liter", nullable = false, precision = 6, scale = 2)
    private BigDecimal pricePerLiter;

    @Column(name = "total_payout", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPayout;

    @Column(name = "created_at", insertable = false, updatable = false)
    private ZonedDateTime createdAt;

    // Helper method to automatically calculate total payout before inserting into the database
    @PrePersist
    @PreUpdate
    public void calculatePayout() {
        if (this.quantityLiters != null && this.pricePerLiter != null) {
            this.totalPayout = this.quantityLiters.multiply(this.pricePerLiter);
        }
    }

    // Getters and Setters
    public Long getDeliveryId() { return deliveryId; }
    public void setDeliveryId(Long deliveryId) { this.deliveryId = deliveryId; }

    public Farmer getFarmer() { return farmer; }
    public void setFarmer(Farmer farmer) { this.farmer = farmer; }
public Long getRecordedByUserId() { return recordedByUserId; }
public void setRecordedByUserId(Long recordedByUserId) { this.recordedByUserId = recordedByUserId; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }

    public String getSessionType() { return sessionType; }
    public void setSessionType(String sessionType) { this.sessionType = sessionType; }

    public BigDecimal getQuantityLiters() { return quantityLiters; }
    public void setQuantityLiters(BigDecimal quantityLiters) { this.quantityLiters = quantityLiters; }

    public BigDecimal getPricePerLiter() { return pricePerLiter; }
    public void setPricePerLiter(BigDecimal pricePerLiter) { this.pricePerLiter = pricePerLiter; }

    public BigDecimal getTotalPayout() { return totalPayout; }
    public void setTotalPayout(BigDecimal totalPayout) { this.totalPayout = totalPayout; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}