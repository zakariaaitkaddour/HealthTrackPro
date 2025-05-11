package com.example.healthcare.Controller;

import com.example.healthcare.Model.DoctorDTO;
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
@RequestMapping("/api/doctors")
public class DoctorController {

    Logger logger = Logger.getLogger(DoctorController.class.getName());

    private final UserRepository userRepository;

    public DoctorController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<DoctorDTO>> getAllDoctors(Authentication authentication) {
        logger.info("Current user roles: " + authentication.getAuthorities()); // Debug

        List<User> doctors = userRepository.findByRole(Role.DOCTOR);
        List<DoctorDTO> doctorDTOs = doctors.stream()
                .map(this::convertToDoctorDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(doctorDTOs);
    }

    private DoctorDTO convertToDoctorDTO(User doctor) {
        DoctorDTO dto = new DoctorDTO();
        dto.setId(doctor.getId());
        dto.setName(doctor.getName());
        dto.setEmail(doctor.getEmail());
        dto.setPhoneNumber(doctor.getPhoneNumber());
        if (doctor.getSpecialization() != null) {
            dto.setSpecializationName(doctor.getSpecialization().getName());
        }
        return dto;
    }
}