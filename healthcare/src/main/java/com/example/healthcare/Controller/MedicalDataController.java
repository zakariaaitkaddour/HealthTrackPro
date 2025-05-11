package com.example.healthcare.Controller;

import com.example.healthcare.Model.MedicalData;
import com.example.healthcare.Model.MedicalDataDTO;
import com.example.healthcare.Model.User;
import com.example.healthcare.repository.MedicalDataRepository;
import com.example.healthcare.repository.UserRepository;
import com.example.healthcare.service.MedicalDataService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import static com.mysql.cj.conf.PropertyKey.logger;

import java.time.LocalDateTime;
import java.util.List;


@RestController
@RequestMapping("/api/medical-data")
public class MedicalDataController {

    private static final Logger logger = LoggerFactory.getLogger(MedicalDataController.class);

    @Autowired
    private MedicalDataService medicalDataService;

    private final MedicalDataRepository medicalDataRepository;
    private final UserRepository userRepository;


    @Autowired
    public MedicalDataController(MedicalDataRepository medicalDataRepository, UserRepository userRepository) {
        this.medicalDataRepository = medicalDataRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<MedicalData>> getMedicalDataByUserId(@PathVariable Long userId) {
        logger.info("Received GET request to fetch medical data for userId: {}", userId);
        try {
            List<MedicalData> data = medicalDataService.getMedicalDataByUserId(userId);
            if (data.isEmpty()) {
                logger.info("No medical data found for userId: {}", userId);
                return ResponseEntity.noContent().build();
            }
            logger.info("Found {} medical data entries for userId: {}", data.size(), userId);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            logger.error("Error fetching medical data: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping
    public ResponseEntity<List<MedicalData>> getMedicalData() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email);
        List<MedicalData> medicalData = medicalDataRepository.findByUser(user);
        return new ResponseEntity<>(medicalData, HttpStatus.OK);
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<?> addMedicalData(
            @PathVariable Long userId,
            @Valid @RequestBody MedicalDataDTO medicalDataDTO) {
        logger.info("Received POST request to add medical data for userId: {}", userId);
        logger.debug("Received MedicalDataDTO: {}", medicalDataDTO);
        try {
            MedicalData medicalData = new MedicalData();
            medicalData.setRecordedAt(medicalDataDTO.getRecordedAt() != null ?
                    medicalDataDTO.getRecordedAt() : LocalDateTime.now());
            medicalData.setBloodSugar(medicalDataDTO.getBloodSugar());
            medicalData.setSystolicBloodPressure(medicalDataDTO.getSystolicBloodPressure());
            medicalData.setDiastolicBloodPressure(medicalDataDTO.getDiastolicBloodPressure());
            medicalData.setHeartRate(medicalDataDTO.getHeartRate());

            MedicalData createdData = medicalDataService.addMedicalData(userId, medicalData);
            logger.info("Medical data created successfully: {}", createdData);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdData);
        } catch (Exception e) {
            logger.error("Detailed error adding medical data: ", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: " + e.getMessage() + " - Check server logs for details");
        }
    }
//

}