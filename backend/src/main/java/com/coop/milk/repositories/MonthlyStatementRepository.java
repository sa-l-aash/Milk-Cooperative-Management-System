package com.coop.milk.repositories;

import com.coop.milk.models.MonthlyStatement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository; // 💡 NEW: Import the Repository tag

import java.util.List;

@Repository // 💡 NEW: Tells Spring Boot to connect this to the database
public interface MonthlyStatementRepository extends JpaRepository<MonthlyStatement, Long> {
    
    List<MonthlyStatement> findByFarmerNumberOrderByGeneratedAtDesc(String farmerNumber);
    
    List<MonthlyStatement> findByManagerUsernameAndStatementMonth(String managerUsername, String statementMonth);
    
    void deleteByManagerUsernameAndStatementMonthAndIsDraftTrue(String managerUsername, String statementMonth);
}