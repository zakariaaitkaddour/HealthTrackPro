package com.example.healthcare.service;


import com.example.healthcare.Model.PatientProfile;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class PatientService {

    private final Map<String, PatientProfile> profiles = new HashMap<>();

    public PatientProfile getProfileByEmail(String email) {
        return profiles.get(email);
    }

    public PatientProfile saveProfile(PatientProfile profile) {
        profiles.put(profile.getEmail(), profile);
        return profile;
    }
}