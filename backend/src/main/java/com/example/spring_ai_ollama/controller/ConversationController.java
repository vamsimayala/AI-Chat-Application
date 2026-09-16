package com.example.spring_ai_ollama.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.spring_ai_ollama.entity.Conversation;
import com.example.spring_ai_ollama.entity.User;
import com.example.spring_ai_ollama.repository.ConversationRepository;
import com.example.spring_ai_ollama.repository.MessageRepository;
import com.example.spring_ai_ollama.repository.UserRepository;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    public ConversationController(
            ConversationRepository conversationRepository,
            UserRepository userRepository,
            MessageRepository messageRepository) {

        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
    }

    @GetMapping("/test")
    public String test() {
        return "Conversation Controller is working!";
    }

    @PostMapping
    public Conversation createConversation() {

        User user = userRepository
                .findByEmail("guest@example.com")
                .orElseGet(() -> {

                    User newUser = new User();

                    newUser.setName("Guest User");
                    newUser.setEmail("guest@example.com");
                    newUser.setPassword("guest");
                    newUser.setCreatedAt(LocalDateTime.now());

                    return userRepository.save(newUser);
                });

        Conversation conversation = new Conversation();

        conversation.setUser(user);
        conversation.setTitle("New Chat");
        conversation.setCreatedAt(LocalDateTime.now());
        conversation.setUpdatedAt(LocalDateTime.now());

        return conversationRepository.save(conversation);
    }

    @GetMapping
    public List<ConversationResponse> getConversations() {

        List<Conversation> conversations =
                conversationRepository.findAll();

        return conversations.stream()
                .map(conversation -> new ConversationResponse(
                        conversation.getId(),
                        conversation.getTitle(),
                        conversation.getCreatedAt(),
                        conversation.getUpdatedAt()
                ))
                .toList();
    }

    @PutMapping("/{conversationId}/title")
    public ConversationResponse updateTitle(
            @PathVariable Long conversationId,
            @RequestBody TitleRequest request) {

        Conversation conversation =
                conversationRepository
                        .findById(conversationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Conversation not found"
                                ));

        conversation.setTitle(request.title());
        conversation.setUpdatedAt(LocalDateTime.now());

        Conversation updatedConversation =
                conversationRepository.save(conversation);

        return new ConversationResponse(
                updatedConversation.getId(),
                updatedConversation.getTitle(),
                updatedConversation.getCreatedAt(),
                updatedConversation.getUpdatedAt()
        );
    }

    @DeleteMapping("/{conversationId}")
    public String deleteConversation(
            @PathVariable Long conversationId) {

        Conversation conversation =
                conversationRepository
                        .findById(conversationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Conversation not found"
                                ));

        // Delete all messages first
        messageRepository.deleteByConversation(
                conversation
        );

        // Then delete the conversation
        conversationRepository.delete(
                conversation
        );

        return "Conversation deleted successfully";
    }

    public record TitleRequest(
            String title
    ) {
    }

    public record ConversationResponse(
            Long id,
            String title,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }
}