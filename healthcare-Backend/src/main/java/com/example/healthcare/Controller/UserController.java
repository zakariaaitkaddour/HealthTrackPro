package com.example.healthcare.Controller;

import com.example.healthcare.Model.User;
import com.example.healthcare.service.UserService;
import com.example.healthcare.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.util.logging.Level;
import java.util.logging.Logger;

import static com.mysql.cj.conf.PropertyKey.logger;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private Logger logger = Logger.getLogger(String.valueOf(UserController.class));

    private UserService userService;// Renommé en minuscules
    private UserRepository userRepository;

    @Autowired
    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }


    @GetMapping("/profile")
//    public ResponseEntity<User> getUserProfile(HttpServletRequest request) {
//        // Récupérer le token JWT depuis l'en-tête Authorization
//        String jwt = request.getHeader("Authorization");
//        if (jwt != null && jwt.startsWith("Bearer ")) {
//            jwt = jwt.substring(7); // Enlever "Bearer "
//        } else {
//            return ResponseEntity.status(401).body(null); // Unauthorized
//        }
//
//        // Appeler le service pour récupérer l'utilisateur
//        User user = userService.findUserProfileByJwt(jwt);
//
//        if (user == null) {
//            return ResponseEntity.notFound().build();
//        }
//
//        return ResponseEntity.ok(user);
//    }
    public ResponseEntity<User> getProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName(); // L'email de l'utilisateur connecté
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(user, HttpStatus.OK);
    }
    @GetMapping("/patientCount")
    // Restreint l'accès aux docteurs
    public ResponseEntity<Integer> getPatientCount() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            logger.info("User {} is requesting patient count");

            int patientCount = userService.countPatient();
            logger.info("Patient count retrieved successfully: {}");
            return new ResponseEntity<>(patientCount, HttpStatus.OK);
        } catch (Exception e) {
            logger.log(Level.parse("Error retrieving patient count: {}"), e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@RequestBody User updatedUser) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        // Mettre à jour les champs
        user.setName(updatedUser.getName());
        user.setPhoneNumber(updatedUser.getPhoneNumber());
        // Ne pas permettre la mise à jour de l'email ou du mot de passe ici
        User savedUser = userRepository.save(user);
        return new ResponseEntity<>(savedUser, HttpStatus.OK);
    }
}