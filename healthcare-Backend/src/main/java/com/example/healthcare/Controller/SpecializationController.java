package com.example.healthcare.Controller;

import com.example.healthcare.Model.Specialization;
import com.example.healthcare.service.SpecializationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/specializations")
@CrossOrigin("*") // To handle CORS issues (if necessary)
public class SpecializationController {

    @Autowired
    private SpecializationService specializationService;

    // Get all specializations
    @GetMapping
    public List<Specialization> getAllSpecializations() {
        return specializationService.getAllSpecializations();
    }

    // Get specialization by ID
    @GetMapping("/{id}")
    public ResponseEntity<Specialization> getSpecializationById(@PathVariable Long id) {
        Optional<Specialization> specialization = specializationService.getSpecializationById(id);
        return specialization.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Create a new specialization
    @PostMapping
    public ResponseEntity<Specialization> createSpecialization(@RequestBody Specialization specialization) {
        Specialization savedSpecialization = specializationService.saveSpecialization(specialization);
        return new ResponseEntity<>(savedSpecialization, HttpStatus.CREATED);
    }

    // Delete a specialization by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSpecialization(@PathVariable Long id) {
        specializationService.deleteSpecialization(id);
        return ResponseEntity.noContent().build();
    }
}