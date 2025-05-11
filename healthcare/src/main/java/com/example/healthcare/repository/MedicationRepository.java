package com.example.healthcare.repository;

import com.example.healthcare.Model.Medication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MedicationRepository extends JpaRepository<Medication, Long> {
    List<Medication> findByUserId(Long userId);

    List<Medication> findByNextReminderTimeBetween(LocalDateTime start, LocalDateTime end);
}