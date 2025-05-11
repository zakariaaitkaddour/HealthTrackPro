package com.example.healthcare.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class TokenCleanupScheduler {

    private final TokenBlacklistService tokenBlacklistService;

    public TokenCleanupScheduler(TokenBlacklistService tokenBlacklistService) {
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Scheduled(cron = "0 0 0 * * ?") // Exécuter tous les jours à minuit
    public void cleanupExpiredTokens() {
        tokenBlacklistService.cleanupExpiredTokens();
    }
}