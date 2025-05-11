package com.example.healthcare.Model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@JsonIgnoreProperties(ignoreUnknown = true)
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ElementCollection
    private List<String> diseaseHistory;

    @ElementCollection
    private List<String> symptoms;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference // Ajout de cette annotation
    private User user;

    // Constructeurs
    public MedicalRecord() {
        this.diseaseHistory = new ArrayList<>();
        this.symptoms = new ArrayList<>();
    }

    public MedicalRecord(User user) {
        this();
        this.user = user;
    }

    public MedicalRecord(Long id, List<String> diseaseHistory, List<String> symptoms, User user) {
        this.id = id;
        this.diseaseHistory = diseaseHistory != null ? diseaseHistory : new ArrayList<>();
        this.symptoms = symptoms != null ? symptoms : new ArrayList<>();
        this.user = user;
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<String> getDiseaseHistory() {
        return diseaseHistory;
    }

    public void setDiseaseHistory(List<String> diseaseHistory) {
        this.diseaseHistory = diseaseHistory != null ? diseaseHistory : new ArrayList<>();
    }

    public List<String> getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(List<String> symptoms) {
        this.symptoms = symptoms != null ? symptoms : new ArrayList<>();
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}