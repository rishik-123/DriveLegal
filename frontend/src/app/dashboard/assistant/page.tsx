"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Send, Mic, MicOff, Trash2, Globe } from "lucide-react";
import api from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳" },
  { code: "mr", label: "मराठी", flag: "🇮🇳" },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm **Astra AI**, your intelligent mobility co-pilot. I can help you with:\n\n• 🚗 Vehicle information & status\n• 📋 Traffic rules & fine amounts\n• 🗺️ Navigation & route info\n• 📄 Document queries\n• 🔒 Safety & compliance\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.chatWithAstra(input, language);
      if (res.ok) {
        const data = res.data as { response: string };
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: "I apologize, but I'm having trouble connecting to my AI service right now. Please try again in a moment.", timestamp: new Date() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "Connection error. Please ensure the backend server is running.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionClass = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognitionClass();
    recognition.lang = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN";
    recognition.onresult = (event: { results: { 0: { 0: { transcript: string } } } }) => {
      setInput(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const clearChat = async () => {
    setMessages([messages[0]]);
    await api.clearChatHistory();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="p-6 pb-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-gradient)" }}>
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Astra AI</h1>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Your Intelligent Mobility Co-Pilot • Powered by Gemini</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-transparent border-none cursor-pointer transition-all"
                style={{
                  background: language === lang.code ? "var(--accent-dim)" : "transparent",
                  color: language === lang.code ? "var(--accent-primary)" : "var(--text-tertiary)",
                }}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>
          <button onClick={clearChat} className="btn btn-ghost px-2 py-2" title="Clear chat">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i === messages.length - 1 ? 0.1 : 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed"
              style={{
                background: msg.role === "user" ? "var(--accent-primary)" : "var(--bg-secondary)",
                color: msg.role === "user" ? "white" : "var(--text-primary)",
                border: msg.role === "assistant" ? "1px solid var(--border-subtle)" : "none",
                borderBottomRightRadius: msg.role === "user" ? "4px" : undefined,
                borderBottomLeftRadius: msg.role === "assistant" ? "4px" : undefined,
              }}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>
                  <Bot size={14} /> Astra AI
                </div>
              )}
              <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
              <div className="mt-2 text-xs opacity-60">
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent-primary)", animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent-primary)", animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent-primary)", animationDelay: "300ms" }} />
                </div>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Astra is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}>
        <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-default)" }}>
          <button onClick={toggleVoice} className="btn btn-ghost px-2 py-2" style={{ color: isListening ? "var(--error)" : "var(--text-tertiary)" }}>
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={language === "hi" ? "अपना सवाल पूछें..." : language === "mr" ? "तुमचा प्रश्न विचारा..." : "Ask Astra anything..."}
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || loading} className="btn btn-primary px-3 py-2">
            <Send size={16} />
          </button>
        </div>
        <div className="flex items-center gap-1 mt-2 px-2">
          <Globe size={12} style={{ color: "var(--text-tertiary)" }} />
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Powered by Google Gemini • {languages.find(l => l.code === language)?.label}
          </span>
        </div>
      </div>
    </div>
  );
}
