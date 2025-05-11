package com.example.healthcare.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Entity
@Table(name = "patient_profiles")
public class PatientProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)

    @NotNull(message = "Email is required")
    private String email;

    @NotNull(message = "Last name is required")
    private String lastName;

    @NotNull(message = "First name is required")
    private String firstName;

    @NotNull(message = "Age is required")
    private Integer age;

    @NotNull(message = "Gender is required")
    private String gender;

    private String condition;
}