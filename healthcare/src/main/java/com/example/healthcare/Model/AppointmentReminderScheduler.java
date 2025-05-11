package com.example.healthcare.Model;

import com.example.healthcare.service.AppointmentService;
import com.example.healthcare.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class AppointmentReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentReminderScheduler.class);

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private EmailService emailService;

    @Scheduled(fixedRate = 60000) // Exécuter toutes les 60 secondes
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime end = now.plusMinutes(1);
        logger.info("Checking for appointment reminders to send between {} and {}", now, end);

        List<AppointmentReminder> reminders = appointmentService.getRemindersToSend(now, end);
        if (reminders.isEmpty()) {
            logger.info("No appointment reminders to send");
            return;
        }

        for (AppointmentReminder reminder : reminders) {
            Appointment appointment = reminder.getAppointment();
            String message = "Rappel : Vous avez un rendez-vous avec le Dr " + appointment.getDoctor() +
                    " le " + appointment.getAppointmentDate() + ".\nNotes : " + (appointment.getReason() != null ? appointment.getReason() : "Aucune note");
            emailService.sendEmail(
                    appointment.getUser().getEmail(),
                    "Rappel de Rendez-vous Médical",
                    message
            );
            reminder.setSent(true);
            // Note : Vous devrez ajouter un repository pour sauvegarder l'état du rappel
            logger.info("Reminder sent for appointment with Dr {} at {}", appointment.getDoctor(), appointment.getAppointmentDate());
        }
    }
}