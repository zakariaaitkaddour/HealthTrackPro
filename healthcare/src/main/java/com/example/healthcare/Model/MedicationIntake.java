package com.example.healthcare.Model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "medication_intake")
public class MedicationIntake {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_data_id", nullable = false)
    private MedicalData medicalData;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medication_id", nullable = false)
    private Medication medication;

    @Column(nullable = false)
    private LocalDateTime intakeTime;

    // Constructeurs, Getters et Setters
    public MedicationIntake() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MedicalData getMedicalData() { return medicalData; }
    public void setMedicalData(MedicalData medicalData) { this.medicalData = medicalData; }
    public Medication getMedication() { return medication; }
    public void setMedication(Medication medication) { this.medication = medication; }
    public LocalDateTime getIntakeTime() { return intakeTime; }
    public void setIntakeTime(LocalDateTime intakeTime) { this.intakeTime = intakeTime; }
}