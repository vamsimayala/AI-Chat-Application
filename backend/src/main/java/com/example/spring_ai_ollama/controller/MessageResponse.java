package com.example.spring_ai_ollama.controller;

import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        String role,
        String content,
        LocalDateTime createdAt
) {
}