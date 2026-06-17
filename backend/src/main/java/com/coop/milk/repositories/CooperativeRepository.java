package com.coop.milk.repositories;

import com.coop.milk.models.Cooperative;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CooperativeRepository extends JpaRepository<Cooperative, Long> {
    // Standard CRUD operations (Save, FindById, Delete) are automatically handled by JpaRepository
    // ADDED: Case-insensitive station lookup safety validation hook
    Optional<Cooperative> findByNameIgnoreCase(String name);
}