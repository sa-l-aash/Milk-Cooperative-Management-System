package com.coop.milk.repositories;

import com.coop.milk.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Custom query method that Spring Data JPA automatically converts into:
    // SELECT * FROM users WHERE username = ?;
    Optional<User> findByUsernameIgnoreCase(String username);
}