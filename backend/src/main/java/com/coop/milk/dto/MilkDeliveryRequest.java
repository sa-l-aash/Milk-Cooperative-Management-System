package com.coop.milk.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class MilkDeliveryRequest {

    @NotNull(message = "Farmer ID is required")
    private Long farmerId;

    @NotNull(message = "Quantity in liters is required")
    @Positive(message = "Quantity must be greater than zero")
    private BigDecimal quantityLiters;

    @NotNull(message = "Session type is required (MORNING/EVENING)")
    private String sessionType;

    // Getters and Setters
    public Long getFarmerId() { return farmerId; }
    public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }

    public BigDecimal getQuantityLiters() { return quantityLiters; }
    public void setQuantityLiters(BigDecimal quantityLiters) { this.quantityLiters = quantityLiters; }

    public String getSessionType() { return sessionType; }
    public void setSessionType(String sessionType) { this.sessionType = sessionType; }
}