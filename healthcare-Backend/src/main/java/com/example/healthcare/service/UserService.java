package com.example.healthcare.service;

import com.example.healthcare.Model.Role;
import com.example.healthcare.Model.User;
import com.example.healthcare.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {


    private final UserRepository userRepository;


    public User findUserByEmail(String email) {
        // Logique pour extraire l'email depuis le JWT
        // Pour cela, tu as besoin de JwtProvider
        // (Nous ajouterons cette dépendance plus tard)
         // À implémenter
        return userRepository.findByEmail(email);
    }

    private String extractEmailFromJwt(String jwt) {
        // Cette logique devrait être dans JwtProvider, pas ici
        // À corriger plus tard
        return null;
    }

    public int countPatient() {
        String role = "PATIENT";
        return userRepository.findAllByRole(Role.valueOf(role)).size();

    }

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
}