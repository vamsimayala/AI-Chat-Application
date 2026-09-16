package com.example.spring_ai_ollama.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Flux;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/ai")
public class Aicontroller {

    private final ChatClient chatClient;

    public Aicontroller(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @PostMapping(
            value = "/ask",
            produces = MediaType.TEXT_PLAIN_VALUE
    )
    public Flux<String> ask(@RequestBody String question) {

        return chatClient
                .prompt()
                .user(question)
                .stream()
                .content();
    }
}