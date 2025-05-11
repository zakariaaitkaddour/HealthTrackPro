package com.example.healthcare.Model;

import lombok.Data;

@Data
public class DoctorDTO {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private String specializationName;
}