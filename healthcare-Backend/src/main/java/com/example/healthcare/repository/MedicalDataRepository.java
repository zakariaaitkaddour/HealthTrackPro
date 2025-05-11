package com.example.healthcare.repository;

import com.example.healthcare.Model.MedicalData;
import com.example.healthcare.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalDataRepository extends JpaRepository<MedicalData, Long> {
    List<MedicalData> findByUserId(Long userId);

    List<MedicalData> findByUser(User user);
}