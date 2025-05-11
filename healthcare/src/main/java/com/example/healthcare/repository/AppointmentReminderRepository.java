package com.example.healthcare.repository;

import com.example.healthcare.Model.AppointmentReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentReminderRepository extends JpaRepository<AppointmentReminder, Long> {
    List<AppointmentReminder> findByReminderTimeBetweenAndSentFalse(LocalDateTime start, LocalDateTime end);

    void deleteByAppointmentId(Long id);
}