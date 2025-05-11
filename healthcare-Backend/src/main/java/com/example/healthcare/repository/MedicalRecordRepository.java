package com.example.healthcare.repository;

import com.example.healthcare.Model.MedicalRecord;
import com.example.healthcare.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    List<MedicalRecord> findByUser(User user);
}