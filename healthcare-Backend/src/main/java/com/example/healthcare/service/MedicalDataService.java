package com.example.healthcare.service;

import com.example.healthcare.Model.MedicalData;
import com.example.healthcare.Model.User;
import com.example.healthcare.exception.ResourceNotFoundException;
import com.example.healthcare.repository.MedicalDataRepository;
import com.example.healthcare.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MedicalDataService {

    private static final Logger logger = LoggerFactory.getLogger(MedicalDataService.class);

    private MedicalDataRepository medicalDataRepository;

    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    public MedicalDataService(MedicalDataRepository medicalDataRepository, UserRepository userRepository) {
        this.medicalDataRepository = medicalDataRepository;
        this.userRepository = userRepository;
    }

    public MedicalData addMedicalData(Long userId, MedicalData medicalData) {
        logger.info("Adding medical data for userId: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        medicalData.setUser(user);
        medicalData.setRecordedAt(LocalDateTime.now());

        // Vérifier les valeurs anormales et envoyer des alertes si nécessaire
        checkForAbnormalValues(medicalData);

        MedicalData savedData = medicalDataRepository.save(medicalData);
        logger.info("Medical data added successfully: {}", savedData);
        return savedData;
    }

    public List<MedicalData> getMedicalDataByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return medicalDataRepository.findByUser(user);
    }

    private void checkForAbnormalValues(MedicalData medicalData) {
        User user = medicalData.getUser();
        StringBuilder alertMessage = new StringBuilder("Alerte de santé pour " + user.getName() + ":\n");

        boolean hasAbnormalValue = false;

        if (medicalData.getBloodSugar() != null) {
            double bloodSugar = medicalData.getBloodSugar();
            if (bloodSugar < 70 || bloodSugar > 130) {
                hasAbnormalValue = true;
                alertMessage.append("Glycémie anormale détectée : ").append(bloodSugar).append(" mg/dL (normale : 70-130 mg/dL)\n");
                logger.warn("Abnormal blood sugar detected for userId {}: {}", user.getId(), bloodSugar);
            }
        }

        if (medicalData.getSystolicBloodPressure() != null) {
            int systolicBP = medicalData.getSystolicBloodPressure();
            if (systolicBP < 90 || systolicBP > 140) {
                hasAbnormalValue = true;
                alertMessage.append("Tension artérielle systolique anormale détectée : ").append(systolicBP).append(" mmHg (normale : 90-140 mmHg)\n");
                logger.warn("Abnormal systolic blood pressure detected for userId {}: {}", user.getId(), systolicBP);
            }
        }

        if (medicalData.getDiastolicBloodPressure() != null) {
            int diastolicBP = medicalData.getDiastolicBloodPressure();
            if (diastolicBP < 60 || diastolicBP > 90) {
                hasAbnormalValue = true;
                alertMessage.append("Tension artérielle diastolique anormale détectée : ").append(diastolicBP).append(" mmHg (normale : 60-90 mmHg)\n");
                logger.warn("Abnormal diastolic blood pressure detected for userId {}: {}", user.getId(), diastolicBP);
            }
        }

        if (medicalData.getHeartRate() != null) {
            int heartRate = medicalData.getHeartRate();
            if (heartRate < 60 || heartRate > 100) {
                hasAbnormalValue = true;
                alertMessage.append("Fréquence cardiaque anormale détectée : ").append(heartRate).append(" bpm (normale : 60-100 bpm)\n");
                logger.warn("Abnormal heart rate detected for userId {}: {}", user.getId(), heartRate);
            }
        }

        if (hasAbnormalValue) {
            sendAlert(user, alertMessage.toString());
        }
    }

    private void sendAlert(User user, String message) {
        emailService.sendEmail(
                user.getEmail(),
                "Alerte de Santé - Valeurs Anormales Détectées",
                message
        );
        logger.info("Alert sent to user {}: {}", user.getEmail(), message);
    }
}