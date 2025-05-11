package com.example.healthcare.repository;


import com.example.healthcare.Model.MedicationIntake;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicationIntakeRepository extends JpaRepository<MedicationIntake, Long> {
    // Trouver toutes les prises associées à un médicament
    List<MedicationIntake> findByMedicationId(Long medicationId);
}