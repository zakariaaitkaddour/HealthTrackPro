package com.example.healthcare.repository;

import com.example.healthcare.Model.MedicationReminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MedicationReminderRepository extends JpaRepository<MedicationReminder, Long> {
    // Trouver tous les rappels associés à un médicament
    List<MedicationReminder> findByMedicationId(Long medicationId);

    // Trouver les rappels dans une fenêtre de temps (pour les rappels intelligents)
    List<MedicationReminder> findByReminderTimeBetween(LocalDateTime start, LocalDateTime end);
}