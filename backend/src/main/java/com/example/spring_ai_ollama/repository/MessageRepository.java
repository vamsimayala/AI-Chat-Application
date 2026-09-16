package com.example.spring_ai_ollama.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import com.example.spring_ai_ollama.entity.Conversation;
import com.example.spring_ai_ollama.entity.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationOrderByCreatedAtAsc(
            Conversation conversation
    );

    @Modifying
    @Transactional
    void deleteByConversation(
            Conversation conversation
    );
}