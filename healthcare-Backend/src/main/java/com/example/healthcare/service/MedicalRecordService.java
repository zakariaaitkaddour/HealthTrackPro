package com.example.healthcare.service;

import com.example.healthcare.Model.MedicalRecord;
import com.example.healthcare.Model.User;
import com.example.healthcare.Model.Role;
import com.example.healthcare.repository.MedicalRecordRepository;
import com.example.healthcare.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicalRecordService {
    private final MedicalRecordRepository medicalRecordRepository;
    private final UserRepository userRepository;

    public MedicalRecordService(
            MedicalRecordRepository medicalRecordRepository,
            UserRepository userRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.userRepository = userRepository;
    }

    public List<MedicalRecord> getMedicalRecordsByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != Role.PATIENT) {
            throw new RuntimeException("User is not a patient");
        }
        return medicalRecordRepository.findByUser(user);
    }

    public MedicalRecord getMedicalRecordById(Long id) {
        return medicalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical record not found"));
    }

    public MedicalRecord updateMedicalRecord(Long userId, Long recordId, List<String> symptoms, List<String> diseaseHistory) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != Role.PATIENT) {
            throw new RuntimeException("User is not a patient");
        }

        MedicalRecord record;
        if (recordId != null) {
            record = medicalRecordRepository.findById(recordId)
                    .orElseThrow(() -> new RuntimeException("Medical record not found"));
            if (!record.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Medical record does not belong to this user");
            }
        } else {
            record = new MedicalRecord(user);
        }

        if (symptoms != null) {
            record.setSymptoms(symptoms);
        }
        if (diseaseHistory != null) {
            record.setDiseaseHistory(diseaseHistory);
        }

        return medicalRecordRepository.save(record);
    }
}