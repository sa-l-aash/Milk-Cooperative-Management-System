package com.coop.milk.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cooperatives")
public class Cooperative {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cooperative_id")
    private Long cooperativeId;

    @Column(name = "name", nullable = false, unique = true, length = 150)
    private String name;

    @Column(name = "county", nullable = false, length = 100)
    private String county;

    @Column(name = "sub_county", nullable = false, length = 100)
    private String subCounty;

    @Column(name = "base_rate_per_liter", nullable = false, precision = 6, scale = 2)
    private BigDecimal baseRatePerLiter;

    // 💡 FIXED: Mapped precisely to the "timestamp" column in your DB
    @Column(name = "timestamp", updatable = false)
    private LocalDateTime timestamp;

    // 💡 ADDED: Fires automatically the millisecond before the database saves the row
    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }

    // Getters and Setters
    public Long getCooperativeId() { return cooperativeId; }
    public void setCooperativeId(Long cooperativeId) { this.cooperativeId = cooperativeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCounty() { return county; }
    public void setCounty(String county) { this.county = county; }

    public String getSubCounty() { return subCounty; }
    public void setSubCounty(String subCounty) { this.subCounty = subCounty; }

    public BigDecimal getBaseRatePerLiter() { return baseRatePerLiter; }
    public void setBaseRatePerLiter(BigDecimal baseRatePerLiter) { this.baseRatePerLiter = baseRatePerLiter; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}