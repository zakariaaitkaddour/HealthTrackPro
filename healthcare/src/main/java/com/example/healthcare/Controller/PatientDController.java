package com.example.healthcare.Controller;

import com.example.healthcare.Model.DoctorDTO;
import com.example.healthcare.Model.PatientDTO;
import com.example.healthcare.Model.Role;
import com.example.healthcare.Model.User;
import com.example.healthcare.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patient")
public class PatientDController {
    Logger logger = Logger.getLogger(DoctorController.class.getName());

    private final UserRepository userRepository;

    public PatientDController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<PatientDTO>> getAllDoctors(Authentication authentication) {
        logger.info("Current user roles: " + authentication.getAuthorities()); // Debug

        List<User> patient = userRepository.findByRole(Role.PATIENT);
        List<PatientDTO> patientDTOS = patient.stream()
                .map(this::convertToPatientDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(patientDTOS);
    }

    private PatientDTO convertToPatientDTO(User patient) {
        PatientDTO dto = new PatientDTO();
        dto.setId(patient.getId());
        dto.setName(patient.getName());
        dto.setEmail(patient.getEmail());
        dto.setPhoneNumber(patient.getPhoneNumber());
        dto.setBirthday(patient.getBirthday());
        return dto;
    }
}
