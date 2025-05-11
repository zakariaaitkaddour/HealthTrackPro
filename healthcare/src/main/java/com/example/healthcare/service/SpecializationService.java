package com.example.healthcare.service;

import com.example.healthcare.Model.Specialization;
import com.example.healthcare.repository.SpecializationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SpecializationService {

    @Autowired
    private SpecializationRepository specializationRepository;

    // Get all specializations
    public List<Specialization> getAllSpecializations() {
        return specializationRepository.findAll();
    }

    // Get a specialization by its ID
    public Optional<Specialization> getSpecializationById(Long id) {
        return specializationRepository.findById(id);
    }

    // Save a new specialization
    public Specialization saveSpecialization(Specialization specialization) {
        return specializationRepository.save(specialization);
    }

    // Delete a specialization by its ID
    public void deleteSpecialization(Long id) {
        specializationRepository.deleteById(id);
    }
}