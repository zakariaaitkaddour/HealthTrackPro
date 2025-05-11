package com.example.healthcare.response;

import lombok.Data;

import java.sql.Date;

@Data
public class AuthResponse {
    private String jwt;
    private String role;
    private String message;
    private Long userId; // Added field for userId
    private String name;// Added field for name
    private String email;
    private Date birthday;
    private String phoneNumber;

}