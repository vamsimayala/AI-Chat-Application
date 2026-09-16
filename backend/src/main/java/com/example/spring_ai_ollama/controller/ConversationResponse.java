package com.example.spring_ai_ollama.controller;

import java.time.LocalDateTime;

public record ConversationResponse(
        Long id,
        String title,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}