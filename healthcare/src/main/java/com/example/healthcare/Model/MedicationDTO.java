package com.example.healthcare.Model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class MedicationDTO {

    @NotNull(message = "Name is required")
    private String name;

    @NotNull(message = "Dosage is required")
    private String dosage;

    @NotBlank(message = "Patient ID is required")
    private String patient; // Format attendu : "id:<number>"

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime nextReminderTime;

    // Constructeurs
    public MedicationDTO() {
    }

    // Getters et Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public LocalDateTime getNextReminderTime() {
        return nextReminderTime;
    }

    public void setNextReminderTime(LocalDateTime nextReminderTime) {
        this.nextReminderTime = nextReminderTime;
    }

    @Override
    public String toString() {
        return "MedicationDTO{" +
                "name='" + name + '\'' +
                ", dosage='" + dosage + '\'' +
                ", nextReminderTime=" + nextReminderTime +
                '}';
    }

    public String getPatient() {
        return patient;
    }

    public void setPatient(String patient) {
        this.patient = patient;
    }
}