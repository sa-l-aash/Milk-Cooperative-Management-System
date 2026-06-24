package com.coop.milk.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "monthly_statements")
public class MonthlyStatement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String farmerNumber;
    private String managerUsername;
    private String statementMonth; // e.g., "MAY-2026"
    private double totalVolumeLiters;
    private double totalPayoutKsh;
    private boolean isDraft; // True if manager clicks "Generate", False if system auto-generates
    
    private LocalDateTime generatedAt;

    public MonthlyStatement() {}

    public MonthlyStatement(String farmerNumber, String managerUsername, String statementMonth, double totalVolumeLiters, double totalPayoutKsh, boolean isDraft) {
        this.farmerNumber = farmerNumber;
        this.managerUsername = managerUsername;
        this.statementMonth = statementMonth;
        this.totalVolumeLiters = totalVolumeLiters;
        this.totalPayoutKsh = totalPayoutKsh;
        this.isDraft = isDraft;
        this.generatedAt = LocalDateTime.now();
    }

    // ================= GETTERS AND SETTERS =================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFarmerNumber() { return farmerNumber; }
    public void setFarmerNumber(String farmerNumber) { this.farmerNumber = farmerNumber; }

    public String getManagerUsername() { return managerUsername; }
    public void setManagerUsername(String managerUsername) { this.managerUsername = managerUsername; }

    public String getStatementMonth() { return statementMonth; }
    public void setStatementMonth(String statementMonth) { this.statementMonth = statementMonth; }

    public double getTotalVolumeLiters() { return totalVolumeLiters; }
    public void setTotalVolumeLiters(double totalVolumeLiters) { this.totalVolumeLiters = totalVolumeLiters; }

    public double getTotalPayoutKsh() { return totalPayoutKsh; }
    public void setTotalPayoutKsh(double totalPayoutKsh) { this.totalPayoutKsh = totalPayoutKsh; }

    public boolean isDraft() { return isDraft; }
    public void setDraft(boolean draft) { isDraft = draft; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}