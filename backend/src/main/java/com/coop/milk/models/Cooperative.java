package com.coop.milk.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.ZonedDateTime;

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

    @Column(name = "created_at", insertable = false, updatable = false)
    private ZonedDateTime createdAt;

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

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}