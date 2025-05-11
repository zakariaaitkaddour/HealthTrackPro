package com.example.healthcare.Controller;

import com.example.healthcare.Model.Appointment;
import com.example.healthcare.Model.AppointmentDTO;
import com.example.healthcare.exception.ResourceNotFoundException;
import com.example.healthcare.service.AppointmentService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentController.class);

    @Autowired
    private AppointmentService appointmentService;

    // Prendre un rendez-vous
    @PostMapping("/user/{userId}")
    public ResponseEntity<Appointment> createAppointment(
            @PathVariable Long userId,
            @RequestBody @Valid Appointment appointment,
            BindingResult result) {
        logger.info("Received POST request to create appointment for userId: {}", userId);
        if (result.hasErrors()) {
            logger.error("Validation errors: {}", result.getAllErrors());
            return ResponseEntity.badRequest().body(null);
        }
        try {
            if (appointment.getDoctor() == null || appointment.getDoctor().getId() == null) {
                throw new IllegalArgumentException("Doctor ID is required");
            }
            Appointment createdAppointment = appointmentService.addAppointment(userId, appointment.getDoctor().getId(), appointment);
            logger.info("Appointment created successfully with id: {}", createdAppointment.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(createdAppointment);
        } catch (ResourceNotFoundException e) {
            logger.error("Error creating appointment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (IllegalArgumentException e) {
            logger.error("Error creating appointment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Unexpected error creating appointment: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // Consulter l'historique des rendez-vous pour patient
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByUserId(@PathVariable Long userId) {
        logger.info("Received GET request to fetch appointments for userId: {}", userId);
        try {
            List<Appointment> appointments = appointmentService.getAppointmentsByUserId(userId);
            if (appointments.isEmpty()) {
                logger.info("No appointments found for userId: {}", userId);
                return ResponseEntity.ok(List.of());
            }
            logger.info("Found {} appointments for userId: {}", appointments.size(), userId);
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            logger.error("Error fetching appointments: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Appointment>> getAppointmentsForDoctor(@PathVariable Long doctorId) {
        logger.info("Received GET request to fetch appointments for doctorId: {}", doctorId);
        try {
            List<Appointment> appointments = appointmentService.getAppointmentsForDoctor(doctorId);
            if (appointments.isEmpty()) {
                logger.info("No appointments found for doctorId: {}", doctorId);
                return ResponseEntity.ok(List.of());
            }

            logger.info("Found {} appointments for doctorId: {}", appointments.size(), doctorId);
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            logger.error("Error fetching appointments: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{appointmentId}/doctor/{doctorId}/status")
    public ResponseEntity<Appointment> updateAppointmentStatus(
            @PathVariable Long appointmentId,
            @PathVariable Long doctorId,
            @RequestBody Map<String, Boolean> status) {
        logger.info("Received PUT request to update appointment id: {} status by doctorId: {}", appointmentId, doctorId);
        try {
            boolean accept = status.get("accept"); // Récupérer la valeur 'accept' depuis le corps
//            if (accept == null) {
//                throw new IllegalArgumentException("Required parameter 'accept' is not present in the request body");
//            }
            Appointment updatedAppointment = appointmentService.updateAppointmentStatus(appointmentId, doctorId, accept);
            logger.info("Appointment id: {} updated to isAccepted: {}", appointmentId, accept);
            return ResponseEntity.ok(updatedAppointment);
        } catch (ResourceNotFoundException e) {
            logger.error("Error updating appointment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (IllegalArgumentException e) {
            logger.error("Error updating appointment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error updating appointment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

//    @GetMapping("/doctor/{doctorId}")
//    public ResponseEntity<List<Appointment>> getAppointmentsByDoctor(@PathVariable Long doctorId) {
//        try {
//            // Vérification de sécurité : S'assurer que le docteur connecté ne peut voir que ses propres rendez-vous
//            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//            String currentUserEmail = authentication.getName();
//            logger.info("User {} is requesting appointments for doctorId: {}", currentUserEmail, doctorId);
//
//            List<Appointment> appointments = appointmentService.getAppointmentsByDoctor(doctorId);
//            logger.info("Successfully retrieved {} appointments for doctorId: {}", appointments.size(), doctorId);
//            return new ResponseEntity<>(appointments, HttpStatus.OK);
//        } catch (ResourceNotFoundException e) {
//            logger.error("Doctor not found with id: {}", doctorId, e);
//            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
//        } catch (Exception e) {
//            logger.error("Error retrieving appointments for doctorId: {}", doctorId, e);
//            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
//        }
//    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PATIENT')") // Sécurise l'accès (ajuste selon les rôles)
    public ResponseEntity<String> deleteAppointment(@PathVariable Long id) {
        try {
            appointmentService.deleteAppointment(id);
            return new ResponseEntity<>("Appointment canceled successfully!", HttpStatus.OK);
        } catch (ResourceNotFoundException e) {
            return new ResponseEntity<>("Appointment not found", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to cancel appointment", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}