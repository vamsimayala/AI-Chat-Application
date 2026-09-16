package com.example.spring_ai_ollama.repository;

import com.example.spring_ai_ollama.entity.Conversation;
import com.example.spring_ai_ollama.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    List<Conversation> findByUserOrderByUpdatedAtDesc(User user);
}