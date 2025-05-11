package com.example.healthcare.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "medication")
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column
    private String name;

    @Column
    private String dosage;

    @Column
    private LocalDateTime nextReminderTime;

    // Constructeurs
    public Medication() {
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }
    public LocalDateTime getNextReminderTime() { return nextReminderTime; }
    public void setNextReminderTime(LocalDateTime nextReminderTime) { this.nextReminderTime = nextReminderTime; }


    @Override
    public String toString() {
        return "Medication{" +
                "id=" + id +
                ", userId=" + (user != null ? user.getId() : null) +
                ", name='" + name + '\'' +
                ", dosage='" + dosage + '\'' +
                ", nextReminderTime=" + nextReminderTime +
                '}';
    }
}