package com.example.healthcare.repository;

import com.example.healthcare.Model.Specialization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpecializationRepository extends JpaRepository<Specialization, Long> {
    // You can add custom query methods here, if necessary.



    // Find a specialization by its name
    Optional<Specialization> findByName(String name);

    List<Specialization> findAll();

    // Find all specializations with a name that contains a certain string (useful for search functionality)
    List<Specialization> findByNameContaining(String name);

    // Check if a specialization with a specific name exists
    boolean existsByName(String name);

    // Delete a specialization by its name
    void deleteByName(String name);

    // Custom query with JPQL (Java Persistence Query Language) to find specializations starting with a letter
    @Query("SELECT s FROM Specialization s WHERE s.name LIKE :prefix%")
    List<Specialization> findByPrefix(@Param("prefix") String prefix);
}
