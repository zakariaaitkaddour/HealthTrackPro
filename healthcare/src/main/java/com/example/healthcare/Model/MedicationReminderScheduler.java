package com.example.healthcare.Model;

import com.example.healthcare.service.MedicationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class MedicationReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(MedicationReminderScheduler.class);

    @Autowired
    private MedicationService medicationService;

    @Scheduled(fixedRate = 60000) // Exécuter toutes les 60 secondes
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime end = now.plusMinutes(1);
        logger.info("Checking for reminders to send between {} and {}", now, end);
        // Ligne 23 : Appel à getRemindersToSend
        medicationService.getRemindersToSend(now, end);
        // Logique pour envoyer les rappels...
    }
}