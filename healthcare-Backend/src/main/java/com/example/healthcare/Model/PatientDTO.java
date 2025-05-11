package com.example.healthcare.Model;

import lombok.Data;

import java.sql.Date;

@Data
public class PatientDTO {
        private Long id;
        private String name;
        private String email;
        private String phoneNumber;
        private Date birthday;

}
