package com.example.healthcare.service;

import com.example.healthcare.Model.Medication;
import com.example.healthcare.Model.User;
import com.example.healthcare.repository.MedicationRepository;
import com.example.healthcare.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MedicationService {

    private final MedicationRepository medicationRepository;

    @Autowired
    public MedicationService(MedicationRepository medicationRepository, UserService userService) {
        this.medicationRepository = medicationRepository;
    }

    /**
     * Ajoute un nouveau médicament pour un utilisateur.
     *
     * @param userId     ID de l'utilisateur
     * @param medication Le médicament à ajouter
     * @return Le médicament créé
     * @throws ResourceNotFoundException Si l'utilisateur n'existe pas
     */
    public Medication addMedication(Long userId, Medication medication) {

        return medicationRepository.save(medication);
    }

    /**
     * Récupère tous les médicaments d'un utilisateur.
     *
     * @param userId ID de l'utilisateur
     * @return Liste des médicaments
     */
    public List<Medication> getMedicationsByUserId(Long userId) {
        return medicationRepository.findByUserId(userId);
    }

    /**
     * Récupère un médicament par son ID.
     *
     * @param id ID du médicament
     * @return Le médicament (ou Optional vide si non trouvé)
     */
    public Optional<Medication> findById(Long id) {
        return medicationRepository.findById(id);
    }

    /**
     * Met à jour un médicament existant.
     *
     * @param medication Le médicament à mettre à jour
     * @return Le médicament mis à jour
     */
    public Medication save(Medication medication) {
        return medicationRepository.save(medication);
    }

    /**
     * Supprime un médicament par son ID.
     *
     * @param id ID du médicament
     */
    public void deleteMedication(Long id) {
        medicationRepository.deleteById(id);
    }

    /**
     * Récupère les médicaments dont les rappels doivent être envoyés entre deux dates/heures.
     *
     * @param start Date/heure de début
     * @param end   Date/heure de fin
     * @return Liste des médicaments à rappeler
     */
    public List<Medication> getRemindersToSend(LocalDateTime start, LocalDateTime end) {
        return medicationRepository.findByNextReminderTimeBetween(start, end);
    }
}