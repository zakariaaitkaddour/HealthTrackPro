package com.example.healthcare.Controller;

import com.example.healthcare.Model.User;
import com.example.healthcare.repository.UserRepository;
import com.example.healthcare.request.LoginRequest;
import com.example.healthcare.response.AuthResponse;
import com.example.healthcare.service.CustomUserDetailService;
import com.example.healthcare.service.TokenBlacklistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import com.example.healthcare.security.JwtUtil;

import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CustomUserDetailService customUserDetailsImpl;

    @Autowired
    private JwtUtil jwtUtil; // Remplacement de JwtProvider par JwtUtil

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> createUserHandler(@Valid @RequestBody User user) {

        try {
            // Check if email already exists
            User isUserExist = userRepository.findByEmail(user.getEmail());
            if (isUserExist != null) {
                AuthResponse errorResponse = new AuthResponse();
                errorResponse.setMessage("Email already exists with another account");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            System.out.println("--------> " + user);

            // Log pour déboguer
            System.out.println("Password before encoding: " + user.getPassword());

            // Vérifiez que le mot de passe n'est pas null
            if (user.getPassword() == null || user.getPassword().isEmpty() ) {
                AuthResponse errorResponse = new AuthResponse();
                errorResponse.setMessage("Password cannot be null or empty");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            // Create new user
            User createdUser = new User();
            createdUser.setEmail(user.getEmail());
            createdUser.setPassword(passwordEncoder.encode(user.getPassword()));
            createdUser.setRole(user.getRole());
            createdUser.setName(user.getName());
            createdUser.setPhoneNumber(user.getPhoneNumber());
            createdUser.setBirthday(user.getBirthday());
            createdUser.setSpecialization(user.getSpecialization());

            // Save user
            User savedUser = userRepository.save(createdUser);

            // Authenticate the user after signup
            Authentication authentication = authenticate(user.getEmail(), user.getPassword());
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generate JWT token using JwtUtil
            String jwt = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getRole().name());

            // Create response
            AuthResponse res = new AuthResponse();
            res.setMessage("Signup success");
            res.setJwt(jwt);
            res.setRole(savedUser.getRole().name());
            res.setUserId(savedUser.getId());
            res.setName(savedUser.getName());
            res.setEmail(savedUser.getEmail());
            res.setBirthday(savedUser.getBirthday());



            return new ResponseEntity<>(res, HttpStatus.CREATED);
        } catch (Exception e) {
            AuthResponse errorResponse = new AuthResponse();
            errorResponse.setMessage("Signup failed: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest loginRequest) {
        try {
            String username = loginRequest.getEmail();
            String password = loginRequest.getPassword();
            String role = loginRequest.getRole();

            // Authenticate user
            Authentication authentication = authenticate(username, password);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Find user
            User user = userRepository.findByEmail(username);
            if (user == null) {
                AuthResponse errorResponse = new AuthResponse();
                errorResponse.setMessage("User not found");
                return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
            }

            // Validate role
            if (!user.getRole().name().equalsIgnoreCase(role)) {
                AuthResponse errorResponse = new AuthResponse();
                errorResponse.setMessage("Invalid role for this user");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            // Generate JWT token using JwtUtil
            String jwt = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

            // Create response
            AuthResponse res = new AuthResponse();
            res.setMessage("Login success");
            res.setJwt(jwt);
            res.setRole(user.getRole().name());
            res.setUserId(user.getId());
            res.setName(user.getName());
            res.setEmail(user.getEmail());
            res.setBirthday(user.getBirthday());
            res.setPhoneNumber(user.getPhoneNumber());


            return new ResponseEntity<>(res, HttpStatus.OK);
        } catch (BadCredentialsException e) {
            AuthResponse errorResponse = new AuthResponse();
            errorResponse.setMessage("Invalid email or password");
            return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
        } catch (Exception e) {
            AuthResponse errorResponse = new AuthResponse();
            errorResponse.setMessage("Login failed: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private Authentication authenticate(String username, String password) {
        UserDetails userDetails = customUserDetailsImpl.loadUserByUsername(username);
        if (userDetails == null) {
            throw new BadCredentialsException("Invalid username");
        }

        if (!passwordEncoder.matches(password, userDetails.getPassword())) {
            throw new BadCredentialsException("Invalid password");
        }

        return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Missing or invalid Authorization header");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        String token = authHeader.substring(7);
        LocalDateTime expiryDate = LocalDateTime.ofInstant(
                jwtUtil.extractExpiration(token).toInstant(),
                ZoneId.systemDefault()
        );

        tokenBlacklistService.blacklistToken(token, expiryDate);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }
}