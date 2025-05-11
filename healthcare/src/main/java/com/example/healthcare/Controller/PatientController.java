package com.example.healthcare.Controller;

import com.example.healthcare.Model.PatientProfile;
import com.example.healthcare.repository.UserRepository;
import com.example.healthcare.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.healthcare.Model.User;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/patient")
public class PatientController {

    @Autowired
    private PatientService PatientService;

    @GetMapping("/profile")
    public ResponseEntity<PatientProfile> getProfile(@RequestParam String email) {
        System.out.println("Fetching profile for email: " + email);
        PatientProfile profile = PatientService.getProfileByEmail(email);
        if (profile == null) {
            System.out.println("Profile not found for email: " + email);
            return ResponseEntity.notFound().build();
        }
        System.out.println("Profile found: " + profile);
        return ResponseEntity.ok(profile);
    }

    @PostMapping("/profile")
    public ResponseEntity<PatientProfile> saveProfile(@RequestBody PatientProfile profile) {
        System.out.println("Saving profile: " + profile);
        PatientProfile savedProfile = PatientService.saveProfile(profile);
        System.out.println("Profile saved: " + savedProfile);
        return ResponseEntity.ok(savedProfile);
    }

//    @Autowired
//    private UserRepository userRepository;
//
//    @GetMapping("/doctors")
//    public ResponseEntity<List<User>> getDoctors() {
//        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//        String email = authentication.getName();
//        User patient = userRepository.findByEmail(email);
//        if (patient == null || !patient.getRole().name().equals("PATIENT")) {
//            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
//        }
//
//        List<User> doctors = userRepository.findAllByRole(DOCTOR);
//        return new ResponseEntity<>(doctors, HttpStatus.OK);
//    }
}