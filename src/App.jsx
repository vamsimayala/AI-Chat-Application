import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);

  // =========================================
  // Reference for stopping AI response
  // =========================================

  const abortControllerRef = useRef(null);

  // =========================================
  // Reference for automatic scrolling
  // =========================================

  const messagesEndRef = useRef(null);

  // =========================================
  // Automatically scroll to latest message
  // =========================================

  useEffect(() => {

    if (messagesEndRef.current) {

      messagesEndRef.current.scrollIntoView({
        behavior: "smooth"
      });

    }

  }, [messages]);

  // =========================================
  // Load all conversations
  // =========================================

  const loadConversations = async () => {

    try {

      const response = await axios.get(
        "http://localhost:8080/api/conversations"
      );

      setConversations(response.data);

    } catch (error) {

      console.error(
        "Load conversations error:",
        error
      );

    }
  };

  // =========================================
  // Load messages
  // =========================================

  const loadMessages = async (id) => {

    try {

      const response = await axios.get(
        `http://localhost:8080/api/messages/${id}`
      );

      setMessages(response.data);
      setConversationId(id);

    } catch (error) {

      console.error(
        "Load messages error:",
        error
      );

    }
  };

  // =========================================
  // Create conversation
  // =========================================

  const createConversation = async () => {

    try {

      const response = await axios.post(
        "http://localhost:8080/api/conversations"
      );

      const newConversation =
        response.data;

      setConversationId(
        newConversation.id
      );

      setMessages([]);

      setConversations((prev) => [
        ...prev,
        newConversation
      ]);

      return newConversation.id;

    } catch (error) {

      console.error(
        "Create conversation error:",
        error
      );

      return null;
    }
  };

  // =========================================
  // Update conversation title
  // =========================================

  const updateConversationTitle = async (
    id,
    title
  ) => {

    try {

      const response = await axios.put(
        `http://localhost:8080/api/conversations/${id}/title`,
        {
          title: title
        }
      );

      const updatedConversation =
        response.data;

      setConversations((prev) =>
        prev.map((conversation) => {

          if (conversation.id === id) {

            return {
              ...conversation,
              title:
                updatedConversation.title,
              updatedAt:
                updatedConversation.updatedAt
            };

          }

          return conversation;

        })
      );

    } catch (error) {

      console.error(
        "Title update error:",
        error
      );

    }
  };

  // =========================================
  // Delete conversation
  // =========================================

  const deleteConversation = async (id) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this chat?"
    );

    if (!confirmed) {
      return;
    }

    try {

      await axios.delete(
        `http://localhost:8080/api/conversations/${id}`
      );

      const remainingConversations =
        conversations.filter(
          (conversation) =>
            conversation.id !== id
        );

      setConversations(
        remainingConversations
      );

      if (conversationId === id) {

        setMessages([]);
        setConversationId(null);

        if (
          remainingConversations.length > 0
        ) {

          const latestConversation =
            remainingConversations[
              remainingConversations.length - 1
            ];

          await loadMessages(
            latestConversation.id
          );

        }

      }

    } catch (error) {

      console.error(
        "Delete conversation error:",
        error
      );

      alert(
        "Unable to delete the chat."
      );

    }
  };

  // =========================================
  // Save message
  // =========================================

  const saveMessage = async (
    id,
    role,
    content
  ) => {

    try {

      await axios.post(
        "http://localhost:8080/api/messages",
        {
          conversationId: id,
          role: role,
          content: content
        }
      );

    } catch (error) {

      console.error(
        "Message save error:",
        error
      );

    }
  };

  // =========================================
  // STOP AI RESPONSE
  // =========================================

  const stopAI = () => {

    if (
      abortControllerRef.current
    ) {

      abortControllerRef.current.abort();

      abortControllerRef.current = null;

    }

  };

  // =========================================
  // ASK AI - LIVE STREAMING
  // =========================================

  const askAI = async () => {

    if (!question.trim()) {
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);

    // Create AbortController
    const controller =
      new AbortController();

    abortControllerRef.current =
      controller;

    try {

      let currentConversationId =
        conversationId;

      const isFirstMessage =
        messages.length === 0;

      // -------------------------------------
      // Create conversation
      // -------------------------------------

      if (currentConversationId === null) {

        currentConversationId =
          await createConversation();

        if (
          currentConversationId === null
        ) {

          setLoading(false);

          return;
        }

      }

      const userQuestion =
        question.trim();

      // -------------------------------------
      // Update title
      // -------------------------------------

      if (isFirstMessage) {

        let chatTitle =
          userQuestion;

        if (chatTitle.length > 40) {

          chatTitle =
            chatTitle.substring(0, 40) +
            "...";

        }

        await updateConversationTitle(
          currentConversationId,
          chatTitle
        );

      }

      // -------------------------------------
      // Display user message
      // -------------------------------------

      const userMessage = {
        role: "user",
        content: userQuestion
      };

      setMessages((prev) => [
        ...prev,
        userMessage
      ]);

      setQuestion("");

      // -------------------------------------
      // Save user message
      // -------------------------------------

      await saveMessage(
        currentConversationId,
        "user",
        userQuestion
      );

      // -------------------------------------
      // Add empty AI message
      // -------------------------------------

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: ""
        }
      ]);

      // -------------------------------------
      // Streaming request
      // -------------------------------------

      const response = await fetch(
        "http://localhost:8080/api/ai/ask",
        {
          method: "POST",

          headers: {
            "Content-Type": "text/plain"
          },

          body: userQuestion,

          signal: controller.signal
        }
      );

      if (!response.ok) {

        throw new Error(
          `HTTP error: ${response.status}`
        );

      }

      if (!response.body) {

        throw new Error(
          "Streaming response is not supported."
        );

      }

      // -------------------------------------
      // Read live response
      // -------------------------------------

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder("utf-8");

      let aiAnswer = "";

      while (true) {

        const {
          value,
          done
        } = await reader.read();

        if (done) {
          break;
        }

        const chunk =
          decoder.decode(
            value,
            {
              stream: true
            }
          );

        aiAnswer += chunk;

        // -----------------------------------
        // Update AI message immediately
        // -----------------------------------

        setMessages((prev) => {

          const updatedMessages =
            [...prev];

          const lastIndex =
            updatedMessages.length - 1;

          updatedMessages[lastIndex] = {
            ...updatedMessages[lastIndex],
            content: aiAnswer
          };

          return updatedMessages;

        });

      }

      // -------------------------------------
      // Flush decoder
      // -------------------------------------

      aiAnswer += decoder.decode();

      // -------------------------------------
      // Save complete AI response
      // -------------------------------------

      if (aiAnswer.trim()) {

        await saveMessage(
          currentConversationId,
          "assistant",
          aiAnswer
        );

      }

      // -------------------------------------
      // Refresh conversations
      // -------------------------------------

      await loadConversations();

    } catch (error) {

      // =====================================
      // STOP BUTTON WAS CLICKED
      // =====================================

      if (
        error.name === "AbortError"
      ) {

        console.log(
          "AI response stopped by user."
        );

        return;

      }

      // =====================================
      // OTHER ERROR
      // =====================================

      console.error(
        "AI streaming error:",
        error
      );

      setMessages((prev) => {

        const updatedMessages =
          [...prev];

        const lastIndex =
          updatedMessages.length - 1;

        if (
          updatedMessages[lastIndex] &&
          updatedMessages[lastIndex].role ===
            "assistant"
        ) {

          updatedMessages[lastIndex] = {
            ...updatedMessages[lastIndex],
            content:
              "Sorry, I couldn't connect to the AI."
          };

        }

        return updatedMessages;

      });

    } finally {

      setLoading(false);

      abortControllerRef.current =
        null;

    }

  };

  // =========================================
  // New chat
  // =========================================

  const handleNewChat = async () => {

    if (loading) {
      return;
    }

    await createConversation();

  };

  // =========================================
  // Initialize application
  // =========================================

  useEffect(() => {

    const initializeApp = async () => {

      try {

        const response = await axios.get(
          "http://localhost:8080/api/conversations"
        );

        const loadedConversations =
          response.data;

        setConversations(
          loadedConversations
        );

        if (
          loadedConversations.length > 0
        ) {

          const latestConversation =
            loadedConversations[
              loadedConversations.length - 1
            ];

          await loadMessages(
            latestConversation.id
          );

        }

      } catch (error) {

        console.error(
          "Initialization error:",
          error
        );

      }

    };

    initializeApp();

  }, []);

  // =========================================
  // UI
  // =========================================

  return (

    <div className="app">

      {/* ================================= */}
      {/* SIDEBAR                           */}
      {/* ================================= */}

      <aside className="sidebar">

        <div className="sidebar-top">

          <div className="brand">

            <div className="brand-icon">

              <img
                src="/cherry-ai.png"
                alt="AI Chat"
                className="cherry-logo"
              />

            </div>

            <div>

              <div className="brand-name">
                AI Chat
              </div>

              <div className="brand-subtitle">
                Spring AI
              </div>

            </div>

          </div>

          <button
            className="sidebar-new-chat"
            onClick={handleNewChat}
            disabled={loading}
            title="New chat"
          >
            +
          </button>

        </div>

        <button
          className="new-chat-large"
          onClick={handleNewChat}
          disabled={loading}
        >

          <span>＋</span>

          New chat

        </button>

        <div className="sidebar-section-title">
          Your conversations
        </div>

        <div className="conversation-list">

          {conversations.length === 0 && (

            <div className="empty-sidebar">
              No conversations yet
            </div>

          )}

          {conversations.map(
            (conversation) => (

              <div
                key={conversation.id}
                className={`conversation-item ${
                  conversation.id ===
                  conversationId
                    ? "active-conversation"
                    : ""
                }`}
                onClick={() =>
                  loadMessages(
                    conversation.id
                  )
                }
              >

                <div className="conversation-icon">
                  💬
                </div>

                <div className="conversation-info">

                  <div className="conversation-title">

                    {conversation.title}

                  </div>

                </div>

                <button
                  className="delete-chat-button"
                  title="Delete chat"
                  onClick={(event) => {

                    event.stopPropagation();

                    deleteConversation(
                      conversation.id
                    );

                  }}
                >
                  ⋯
                </button>

              </div>

            )
          )}

        </div>

        <div className="sidebar-footer">

          <div className="status-dot"></div>

          <span>
            Ollama AI connected
          </span>

        </div>

      </aside>

      {/* ================================= */}
      {/* MAIN CHAT                         */}
      {/* ================================= */}

      <main className="chat-main">

        {/* ================================= */}
        {/* HEADER                             */}
        {/* ================================= */}

        <header className="chat-header">

          <div className="header-info">

            <div className="ai-avatar">

              <img
                src="/cherry-ai.png"
                alt="AI Chat"
                className="cherry-logo"
              />

            </div>

            <div>

              <div className="header-title">
                AI Assistant
              </div>

              <div className="header-status">

                <span className="online-dot"></span>

                Online · Llama 3.2

              </div>

            </div>

          </div>

          <div className="header-actions">

            <button
              title="New chat"
              onClick={handleNewChat}
              disabled={loading}
            >
              ＋
            </button>

          </div>

        </header>

        {/* ================================= */}
        {/* MESSAGES                           */}
        {/* ================================= */}

        <div className="chat-messages">

          {messages.length === 0 && (

            <div className="welcome-screen">

              <div className="welcome-icon">

                <img
                  src="/cherry-ai.png"
                  alt="AI Chat"
                  className="cherry-logo"
                />

              </div>

              <h1>
                How can I help you?
              </h1>

              <p>
                Ask me anything. I'm here to help
                you learn, build and explore.
              </p>

              <div className="suggestion-grid">

                <button
                  onClick={() =>
                    setQuestion(
                      "Explain Java in simple words"
                    )
                  }
                >

                  <span>☕</span>

                  <div>

                    <strong>
                      Learn Java
                    </strong>

                    <small>
                      Explain Java simply
                    </small>

                  </div>

                </button>

                <button
                  onClick={() =>
                    setQuestion(
                      "What is Spring Boot?"
                    )
                  }
                >

                  <span>⚡</span>

                  <div>

                    <strong>
                      Spring Boot
                    </strong>

                    <small>
                      Learn the basics
                    </small>

                  </div>

                </button>

                <button
                  onClick={() =>
                    setQuestion(
                      "Help me write a Java program"
                    )
                  }
                >

                  <span>💻</span>

                  <div>

                    <strong>
                      Write code
                    </strong>

                    <small>
                      Build a Java program
                    </small>

                  </div>

                </button>

                <button
                  onClick={() =>
                    setQuestion(
                      "Explain REST API"
                    )
                  }
                >

                  <span>🔗</span>

                  <div>

                    <strong>
                      REST API
                    </strong>

                    <small>
                      Understand APIs
                    </small>

                  </div>

                </button>

              </div>

            </div>

          )}

          {messages.map(
            (message, index) => (

              <div
                key={index}
                className={`message-row ${
                  message.role === "user"
                    ? "user-row"
                    : "assistant-row"
                }`}
              >

                {message.role === "assistant" && (

                  <div className="message-avatar">

                    <img
                      src="/cherry-ai.png"
                      alt="AI Chat"
                      className="cherry-logo"
                    />

                  </div>

                )}

                <div
                  className={`message-bubble ${
                    message.role === "user"
                      ? "user-bubble"
                      : "assistant-bubble"
                  }`}
                >

                  <div className="message-label">

                    {message.role === "user"
                      ? "You"
                      : "AI Assistant"}

                  </div>

                  <div className="message-content">

                    {message.content}

                    {loading &&
                      index ===
                        messages.length - 1 &&
                      message.role ===
                        "assistant" && (

                        <span className="typing-cursor">
                          ▌
                        </span>

                      )}

                  </div>

                </div>

              </div>

            )
          )}

          {/* =================================
              AUTOMATIC SCROLL TARGET
              ================================= */}

          <div
            ref={messagesEndRef}
          ></div>

        </div>

        {/* ================================= */}
        {/* INPUT                             */}
        {/* ================================= */}

        <div className="input-wrapper">

          <div className="chat-input-area">

            <textarea
              value={question}
              placeholder="Message AI Assistant..."
              rows="1"
              disabled={loading}
              onChange={(e) =>
                setQuestion(e.target.value)
              }
              onKeyDown={(e) => {

                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !loading
                ) {

                  e.preventDefault();

                  askAI();

                }

              }}
            />

            {/* =================================
                SEND / STOP
                ================================= */}

            {loading ? (

              <button
                className="stop-button"
                onClick={stopAI}
                title="Stop generating"
              >

                <span className="stop-icon"></span>

              </button>

            ) : (

              <button
                className="send-button"
                onClick={askAI}
                disabled={!question.trim()}
                title="Send message"
              >

                ↑

              </button>

            )}

          </div>

          <div className="input-hint">

            AI can make mistakes. Check important
            information.

          </div>

        </div>

      </main>

    </div>

  );

}

export default App;