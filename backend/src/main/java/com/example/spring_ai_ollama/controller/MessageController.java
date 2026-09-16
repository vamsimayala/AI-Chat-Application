package com.example.spring_ai_ollama.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.spring_ai_ollama.entity.Conversation;
import com.example.spring_ai_ollama.entity.Message;
import com.example.spring_ai_ollama.repository.ConversationRepository;
import com.example.spring_ai_ollama.repository.MessageRepository;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;

    public MessageController(
            MessageRepository messageRepository,
            ConversationRepository conversationRepository) {

        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
    }

    @PostMapping
    public Message saveMessage(@RequestBody MessageRequest request) {

        Conversation conversation = conversationRepository
                .findById(request.conversationId())
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        Message message = new Message();

        message.setConversation(conversation);
        message.setRole(request.role());
        message.setContent(request.content());
        message.setCreatedAt(LocalDateTime.now());

        return messageRepository.save(message);
    }

    @GetMapping("/{conversationId}")
    public List<MessageResponse> getMessages(
            @PathVariable Long conversationId) {

        Conversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        List<Message> messages =
                messageRepository
                        .findByConversationOrderByCreatedAtAsc(conversation);

        return messages.stream()
                .map(message -> new MessageResponse(
                        message.getId(),
                        message.getRole(),
                        message.getContent(),
                        message.getCreatedAt()
                ))
                .toList();
    }

    public record MessageRequest(
            Long conversationId,
            String role,
            String content
    ) {
    }
}