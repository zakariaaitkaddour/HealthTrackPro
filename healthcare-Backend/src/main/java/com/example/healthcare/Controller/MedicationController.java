package com.example.healthcare.Controller;

import com.example.healthcare.Model.Medication;
import com.example.healthcare.Model.MedicationDTO;
import com.example.healthcare.Model.User;
import com.example.healthcare.service.MedicationService;
import com.example.healthcare.service.UserService;
import com.example.healthcare.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/medications")
public class MedicationController {

    private static final Logger logger = LoggerFactory.getLogger(MedicationController.class);

    private final MedicationService medicationService;
    private final UserService userService;

    public MedicationController(MedicationService medicationService, UserService userService) {
        this.medicationService = medicationService;
        this.userService = userService;
    }

    @PostConstruct
    public void init() {
        logger.info("MedicationController initialized");
    }

    /**
     * Ajoute un nouveau médicament pour un utilisateur.
     *
     * @param userId        ID de l'utilisateur
     * @param medicationDTO DTO contenant les informations du médicament
     * @return Le médicament créé
     */

    @PostMapping("/user/{userId}")
    public ResponseEntity<Medication> addMedication(
            @PathVariable Long userId,
            @RequestBody @Valid MedicationDTO medicationDTO) {
        logger.info("Received POST request to add medication for userId: {}", userId);
        logger.debug("MedicationDTO received: {}", medicationDTO);
        try {
            User user = userService.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

            Medication medication = new Medication();
            medication.setUser(user);
            medication.setName(medicationDTO.getName());
            medication.setDosage(medicationDTO.getDosage());
            medication.setNextReminderTime(medicationDTO.getNextReminderTime());

            Medication createdMedication = medicationService.addMedication(userId, medication);
            logger.info("Medication created successfully: {}", createdMedication);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdMedication);
        } catch (ResourceNotFoundException e) {
            logger.error("Error adding medication: User not found - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            logger.error("Error adding medication: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')") // Restreint l'accès aux utilisateurs avec le rôle DOCTOR
    public ResponseEntity<Medication> addMedication(
            @RequestBody @Valid MedicationDTO medicationDTO,
            Principal principal) {
        logger.info("Received POST request to add medication: {}", medicationDTO);
        try {
            // Extraire l'ID du patient à partir de la chaîne "id:<number>"
            Long patientId = parsePatientId(medicationDTO.getPatient());
            User patient = userService.findById(patientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

            // Optionnel : Vérifier que le docteur est autorisé à agir pour ce patient
            String currentDoctorEmail = principal.getName(); // Récupère l'email du docteur connecté
            // Ajoute une logique pour vérifier si le docteur peut traiter ce patient si nécessaire

            Medication medication = new Medication();
            medication.setUser(patient);
            medication.setName(medicationDTO.getName());
            medication.setDosage(medicationDTO.getDosage());
            medication.setNextReminderTime(medicationDTO.getNextReminderTime());

            Medication createdMedication = medicationService.addMedication(patientId, medication);
            logger.info("Medication created successfully: {}", createdMedication);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdMedication);
        } catch (ResourceNotFoundException e) {
            logger.error("Error adding medication: Patient not found - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (IllegalArgumentException e) {
            logger.error("Error adding medication: Invalid patient ID format - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error adding medication: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    // Méthode pour parser la chaîne "id:<number>" et extraire l'ID
    private Long parsePatientId(String patient) {
        if (patient == null || !patient.startsWith("id:")) {
            throw new IllegalArgumentException("Patient ID must be in the format 'id:<number>'");
        }
        String idStr = patient.substring(3); // Récupère la partie après "id:"
        try {
            return Long.parseLong(idStr.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid patient ID format: " + patient);
        }
    }

    /**
     * Récupère tous les médicaments d'un utilisateur.
     *
     * @param userId ID de l'utilisateur
     * @return Liste des médicaments
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Medication>> getMedicationsByUserId(@PathVariable Long userId) {
        logger.info("Received GET request to fetch medications for userId: {}", userId);
        try {
            userService.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

            List<Medication> medications = medicationService.getMedicationsByUserId(userId);
            if (medications.isEmpty()) {
                logger.info("No medications found for userId: {}", userId);
                return ResponseEntity.noContent().build();
            }
            logger.info("Found {} medications for userId: {}", medications.size(), userId);
            return ResponseEntity.ok(medications);
        } catch (ResourceNotFoundException e) {
            logger.error("Error fetching medications: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            logger.error("Error fetching medications: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    /**
     * Récupère un médicament par son ID.
     *
     * @param id ID du médicament
     * @return Le médicament
     */
    @GetMapping("/{id}")
    public ResponseEntity<Medication> getMedicationById(@PathVariable Long id) {
        logger.info("Received GET request to fetch medication with id: {}", id);
        try {
            Medication medication = medicationService.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Medication not found with id: " + id));
            logger.info("Found medication with id: {}", id);
            return ResponseEntity.ok(medication);
        } catch (ResourceNotFoundException e) {
            logger.error("Error fetching medication: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            logger.error("Error fetching medication: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    /**
     * Met à jour un médicament existant.
     *
     * @param id            ID du médicament
     * @param medicationDTO DTO contenant les nouvelles informations
     * @return Le médicament mis à jour
     */
    @PutMapping("/{id}")
    public ResponseEntity<Medication> updateMedication(
            @PathVariable Long id,
            @RequestBody @Valid MedicationDTO medicationDTO) {
        logger.info("Received PUT request to update medication with id: {}", id);
        logger.debug("MedicationDTO received: {}", medicationDTO);
        try {
            Medication existingMedication = medicationService.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Medication not found with id: " + id));

            existingMedication.setName(medicationDTO.getName());
            existingMedication.setDosage(medicationDTO.getDosage());
            existingMedication.setNextReminderTime(medicationDTO.getNextReminderTime());

            Medication updatedMedication = medicationService.save(existingMedication);
            logger.info("Medication updated successfully: {}", updatedMedication);
            return ResponseEntity.ok(updatedMedication);
        } catch (ResourceNotFoundException e) {
            logger.error("Error updating medication: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            logger.error("Error updating medication: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    /**
     * Supprime un médicament.
     *
     * @param id ID du médicament
     * @return Réponse sans contenu si la suppression réussit
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedication(@PathVariable Long id) {
        logger.info("Received DELETE request to delete medication with id: {}", id);
        try {
            Medication medication = medicationService.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Medication not found with id: " + id));

            medicationService.deleteMedication(id);
            logger.info("Medication deleted successfully with id: {}", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            logger.error("Error deleting medication: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            logger.error("Error deleting medication: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}