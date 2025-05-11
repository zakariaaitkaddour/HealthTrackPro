package com.example.healthcare.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity
public class AppConfig {

    @Autowired
    private JwtTokenValidator jwtTokenValidator;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .sessionManagement(management -> management.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        // Autoriser les endpoints sous /api/auth/** (signup, login, etc.)
                        .requestMatchers("/api/auth/**").permitAll()
                        // Autoriser /auth/signing et /auth/signup (si tu en as besoin)
                        .requestMatchers("/auth/signing", "/auth/signup").permitAll()
                        // Exiger une authentification pour les autres endpoints sous /api/**
                        .requestMatchers("/api/users/**").authenticated()
                                .requestMatchers("/api/doctors").hasRole("PATIENT")
                                .requestMatchers("/api/doctors/**").hasRole("DOCTOR")
                        .requestMatchers("/api/patients/**").hasAnyRole("PATIENT","DOCTOR")
                        .requestMatchers("/api/medications/**").hasAnyRole("DOCTOR","PATIENT")
//                        .requestMatchers("/api/specializations").permitAll()
//                        .requestMatchers("/api/specializations/**").permitAll()
                         .requestMatchers("/api/medical-data/**").hasAnyRole("DOCTOR","PATIENT")
                         .requestMatchers("/api/doctors").hasRole("PATIENT")
                                .requestMatchers("/api/appointments/**").hasAnyRole("DOCTOR", "PATIENT")
                        .anyRequest().permitAll()

                )
                // Ajouter le filtre JwtTokenValidator (injecté comme bean)
                .addFilterBefore(jwtTokenValidator, BasicAuthenticationFilter.class)
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()));

        return http.build();
    }

    private CorsConfigurationSource corsConfigurationSource() {
        return new CorsConfigurationSource() {
            @Override
            public CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
                CorsConfiguration cfg = new CorsConfiguration();
                cfg.setAllowedOrigins(Arrays.asList(
                        "http://192.168.137.22:19006",
                        "exp://192.168.137.22:19000",
                        "http://10.0.2.2:19006",
                        "http://10.0.2.2:8080",
                        "http://localhost:3000",
                        "http://localhost:3001"
                ));
                cfg.setAllowedMethods(Collections.singletonList("*"));
                cfg.setAllowCredentials(true);
                cfg.setAllowedHeaders(Collections.singletonList("*"));
                cfg.setExposedHeaders(Arrays.asList("Authorization"));
                cfg.setMaxAge(3600L);
                return cfg;
            }
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}