package com.coop.milk.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CooperativeAdminDTO {
    private Long cooperativeId;
    private String name;
    private String county;
    private String subCounty;
    private String managerName;
    private long farmerCount;
    private BigDecimal baseRatePerLiter;
    private LocalDateTime timestamp;

    public CooperativeAdminDTO(Long cooperativeId, String name, String county, String subCounty, 
                               String managerName, long farmerCount, BigDecimal baseRatePerLiter, LocalDateTime timestamp) {
        this.cooperativeId = cooperativeId;
        this.name = name;
        this.county = county;
        this.subCounty = subCounty;
        this.managerName = managerName;
        this.farmerCount = farmerCount;
        this.baseRatePerLiter = baseRatePerLiter;
        this.timestamp = timestamp;
    }

    // Getters
    public Long getCooperativeId() { return cooperativeId; }
    public String getName() { return name; }
    public String getCounty() { return county; }
    public String getSubCounty() { return subCounty; }
    public String getManagerName() { return managerName; }
    public long getFarmerCount() { return farmerCount; }
    public BigDecimal getBaseRatePerLiter() { return baseRatePerLiter; }
    public LocalDateTime getTimestamp() { return timestamp; }
}