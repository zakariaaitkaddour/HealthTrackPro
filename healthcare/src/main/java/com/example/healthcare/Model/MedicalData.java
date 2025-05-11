package com.example.healthcare.Model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "medical_data")
public class MedicalData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference(value = "user-medicaldata")
    private User user;

    @Column(nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime recordedAt;

    @Column
    private Double bloodSugar;

    @Column
    private Integer systolicBloodPressure;

    @Column
    private Integer diastolicBloodPressure;

    @Column
    private Integer heartRate;

    // Constructeurs, Getters et Setters
    public MedicalData() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
    public Double getBloodSugar() { return bloodSugar; }
    public void setBloodSugar(Double bloodSugar) { this.bloodSugar = bloodSugar; }
    public Integer getSystolicBloodPressure() { return systolicBloodPressure; }
    public void setSystolicBloodPressure(Integer systolicBloodPressure) { this.systolicBloodPressure = systolicBloodPressure; }
    public Integer getDiastolicBloodPressure() { return diastolicBloodPressure; }
    public void setDiastolicBloodPressure(Integer diastolicBloodPressure) { this.diastolicBloodPressure = diastolicBloodPressure; }
    public Integer getHeartRate() { return heartRate; }
    public void setHeartRate(Integer heartRate) { this.heartRate = heartRate; }
}