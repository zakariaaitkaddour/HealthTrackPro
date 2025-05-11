package com.example.healthcare.service;

import com.example.healthcare.Model.Appointment;
import com.example.healthcare.Model.AppointmentReminder;
import com.example.healthcare.Model.Role;
import com.example.healthcare.Model.User;
import com.example.healthcare.exception.ResourceNotFoundException;
import com.example.healthcare.repository.AppointmentReminderRepository;
import com.example.healthcare.repository.AppointmentRepository;
import com.example.healthcare.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AppointmentService {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentService.class);

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AppointmentReminderRepository appointmentReminderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    public AppointmentService(AppointmentRepository appointmentRepository, UserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
    }

    // Prendre un rendez-vous
    public Appointment addAppointment(Long userId, Long doctorId, Appointment appointment) {
        logger.info("Adding appointment for userId: {} with doctorId: {}", userId, doctorId);
        try {
            // Log pour vérifier les données reçues
            logger.info("Received appointment: date={}, reason={}, doctorId={}",
                    appointment.getAppointmentDate(), appointment.getReason(), doctorId);

            // Vérifier que les champs obligatoires sont présents
            if (appointment.getAppointmentDate() == null) {
                throw new IllegalArgumentException("Appointment date is required");
            }
            if (appointment.getReason() == null || appointment.getReason().trim().isEmpty()) {
                throw new IllegalArgumentException("Reason is required");
            }

            // Vérifier que l'utilisateur (patient) existe
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

            // Vérifier que le médecin existe et a le rôle DOCTOR
            User doctor = userRepository.findById(doctorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));
            if (doctor.getRole() != Role.DOCTOR) {
                throw new IllegalArgumentException("Selected user is not a doctor");
            }

            // Vérifier que la date du rendez-vous est dans le futur
            if (appointment.getAppointmentDate().isBefore(LocalDateTime.now())) {
                throw new IllegalArgumentException("Appointment date must be in the future");
            }

            // Associer l'utilisateur et le médecin
            appointment.setUser(user);
            appointment.setDoctor(doctor);
            appointment.setAccepted(false); // Par défaut, en attente

            // Log avant l'enregistrement pour déboguer
            logger.info("Saving appointment: date={}, reason={}, userId={}, doctorId={}",
                    appointment.getAppointmentDate(), appointment.getReason(), userId, doctorId);

            // Enregistrer le rendez-vous
            Appointment savedAppointment = appointmentRepository.save(appointment);

            // Générer un rappel 24 heures avant le rendez-vous
            try {
                generateReminder(savedAppointment);
            } catch (Exception e) {
                logger.error("Failed to generate reminder for appointment id: {}: {}", savedAppointment.getId(), e.getMessage());
            }

            logger.info("Appointment added successfully: {}", savedAppointment);
            return savedAppointment;
        } catch (Exception e) {
            logger.error("Error adding appointment for userId: {}: {}", userId, e.getMessage(), e);
            throw e; // Laisser le contrôleur gérer l'erreur
        }
    }

    // Consulter l'historique des rendez-vous
    public List<Appointment> getAppointmentsByUserId(Long userId) {
        logger.info("Fetching appointments for userId: {}", userId);
        List<Appointment> appointments = appointmentRepository.findByUserId(userId);

        logger.info("Found {} appointments", appointments.size());
        return appointments;
    }

    // Générer un rappel pour le rendez-vous
    private void generateReminder(Appointment appointment) {
        LocalDateTime appointmentDate = appointment.getAppointmentDate();
        LocalDateTime reminderTime = appointmentDate.minusHours(24); // Rappel 24h avant

        // S'assurer que le rappel est dans le futur
        if (reminderTime.isAfter(LocalDateTime.now())) {
            AppointmentReminder reminder = new AppointmentReminder();
            reminder.setAppointment(appointment);
            reminder.setReminderTime(reminderTime);
            reminder.setSent(true);
            appointmentReminderRepository.save(reminder);
            logger.info("Generated reminder for appointment at {}: reminder set for {}", appointmentDate, reminderTime);
        } else {
            logger.info("Reminder time {} is in the past, no reminder generated for appointment at {}", reminderTime, appointmentDate);
        }
    }

    // Récupérer les rappels à envoyer
    public List<AppointmentReminder> getRemindersToSend(LocalDateTime start, LocalDateTime end) {
        logger.info("Fetching appointment reminders to send between {} and {}", start, end);
        List<AppointmentReminder> reminders = appointmentReminderRepository.findByReminderTimeBetweenAndSentFalse(start, end);
        logger.info("Found {} appointment reminders to send", reminders.size());
        return reminders;
    }


    public List<Appointment> getAppointmentsForDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public Appointment updateAppointmentStatus(Long appointmentId, Long doctorId, boolean accept) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        // Vérifier que le médecin est bien celui associé au rendez-vous
        if (!appointment.getDoctor().getId().equals(doctorId)) {
            throw new IllegalArgumentException("Only the assigned doctor can update this appointment");
        }

        appointment.setAccepted(accept);
        return appointmentRepository.save(appointment);
    }

    @Transactional
    public void deleteAppointment(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        // Supprimer les rappels associés
        appointmentReminderRepository.deleteByAppointmentId(id);
        appointmentRepository.delete(appointment);
    }

    public List<Appointment> getAppointmentsByDoctor(Long doctorId) {
        // Vérifier si le docteur existe
        userRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        // Récupérer les rendez-vous associés au docteur
        return appointmentRepository.findByDoctorId(doctorId);
    }
}