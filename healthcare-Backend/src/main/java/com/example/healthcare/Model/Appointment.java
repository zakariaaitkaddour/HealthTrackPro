    package com.example.healthcare.Model;

    import com.fasterxml.jackson.annotation.JsonBackReference;
    import com.fasterxml.jackson.annotation.JsonFormat;
    import jakarta.persistence.*;
    import java.time.LocalDateTime;

    @Entity
    @Table(name = "appointment")
    public class Appointment {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne()
        @JoinColumn(name = "user_id", nullable = false)
        @JsonBackReference(value = "user-appointments")
        private User user;

        @ManyToOne
        @JoinColumn(name = "doctor_id", nullable = false)
        private User doctor;

        @Column(nullable = false)
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime appointment_date;

        @Column
        private String reason;

        @Column(nullable = false)
        private boolean isAccepted = false;

        // Constructeurs
        public Appointment() {

        }

        // Getters et Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public User getUser() { return user; }
        public void setUser(User user) { this.user = user; }
        public LocalDateTime getAppointmentDate() { return appointment_date; }
        public void setAppointmentDate(LocalDateTime appointmentDate) { this.appointment_date = appointmentDate; }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public User getDoctor() {
            return doctor;
        }

        public void setDoctor(User doctor) {
            this.doctor = doctor;
        }

        public boolean isAccepted() {
            return isAccepted;
        }

        public void setAccepted(boolean accepted) {
            isAccepted = accepted;
        }
    }