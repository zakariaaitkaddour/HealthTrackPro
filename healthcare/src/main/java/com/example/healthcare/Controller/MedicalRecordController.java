package com.example.healthcare.Controller;

import com.example.healthcare.Model.MedicalRecord;
import com.example.healthcare.service.MedicalRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medical-records")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @Autowired
    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    // Fetch all medical records for a user (quick consultation of medical history)
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<MedicalRecord>> getMedicalRecordsByUserId(@PathVariable Long userId) {
        try {
            List<MedicalRecord> records = medicalRecordService.getMedicalRecordsByUserId(userId);
            if (records.isEmpty()) {
                return ResponseEntity.noContent().build(); // 204 No Content
            }
            return ResponseEntity.ok(records); // 200 OK
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null); // 400 Bad Request
        }
    }

    // Fetch a specific medical record by ID
    @GetMapping("/{id}")
    public ResponseEntity<MedicalRecord> getMedicalRecordById(@PathVariable Long id) {
        try {
            MedicalRecord record = medicalRecordService.getMedicalRecordById(id);
            return ResponseEntity.ok(record); // 200 OK
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build(); // 404 Not Found
        }
    }

    // Create or update a medical record with symptoms and disease history
    @PutMapping("/user/{userId}")
    public ResponseEntity<MedicalRecord> updateMedicalRecord(
            @PathVariable Long userId,
            @RequestParam(required = false) Long recordId,
            @RequestBody Map<String, List<String>> requestBody) {
        try {
            List<String> symptoms = requestBody.get("symptoms");
            List<String> diseaseHistory = requestBody.get("diseaseHistory");
            MedicalRecord updatedRecord = medicalRecordService.updateMedicalRecord(userId, recordId, symptoms, diseaseHistory);
            return ResponseEntity.ok(updatedRecord); // 200 OK
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null); // 400 Bad Request
        }
    }
}