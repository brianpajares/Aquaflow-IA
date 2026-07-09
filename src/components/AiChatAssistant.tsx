import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Trash2, ShieldAlert, Bot, User, RefreshCw, HelpCircle } from "lucide-react";
import { Parcel, AnalysisResult } from "../types";

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

interface AiChatAssistantProps {
  language: "es" | "en";
  currentParcel: Parcel | null;
  currentAnalysis: AnalysisResult | null;
}

export default function AiChatAssistant({
  language,
  currentParcel,
  currentAnalysis
}: AiChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: language === "es"
        ? "¡Hola! Soy AquaBot AI, tu consultor hidrogeológico de confianza. Puedo asesorarte sobre pre-factibilidad hídrica, prospección geofísica, diseño de pozos tubulares y la regulación legal de la ANA en Perú. ¿En qué puedo ayudarte hoy?"
        : "Hello! I am AquaBot AI, your trusted hydrogeological advisor. I can help with water pre-feasibility, geophysics, tubular well design, and legal frameworks. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = {
    es: {
      title: "Asistente Técnico AquaBot AI",
      subtitle: "Asesoría experta interactiva respaldada por Gemini 3.5",
      placeholder: "Pregunta sobre pozos, geofísica o trámites ANA...",
      clear: "Borrar chat",
      quickPermits: "¿Qué trámites de la ANA necesito?",
      quickGeophysics: "¿Por qué recomiendas ERT antes de perforar?",
      quickPump: "¿A qué profundidad coloco la bomba?",
      warning: "AquaBot proporciona orientación técnica preliminar. Siempre consulte con un ingeniero colegiado in-situ."
    },
    en: {
      title: "AquaBot AI Technical Advisor",
      subtitle: "Interactive expert guidance backed by Gemini 3.5",
      placeholder: "Ask about wells, geophysics, or water rights...",
      clear: "Clear Chat",
      quickPermits: "What permits are required?",
      quickGeophysics: "Why recommend ERT over SEV?",
      quickPump: "At what depth should the pump go?",
      warning: "AquaBot provides advisory pre-feasibility data. Always confirm with an on-site professional engineer."
    }
  }[language];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          parcel: currentParcel,
          analysis: currentAnalysis
        })
      });
      const data = await response.json();
      
      const botMsg: Message = {
        sender: "bot",
        text: data.text || (language === "es" ? "Lo siento, hubo un error de procesamiento." : "Sorry, a processing error occurred."),
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: Message = {
        sender: "bot",
        text: language === "es" ? "Disculpa, no pude conectar con el servidor central de IA." : "Apologies, could not connect to the central AI server.",
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: "bot",
        text: language === "es"
          ? "Chat reiniciado. ¿Tienes más preguntas sobre el acuífero de tu predio o el diseño constructivo?"
          : "Chat cleared. Do you have further questions about your property's aquifer or construction specs?",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  return (
    <div className="bg-bg-graphite border border-border-dark rounded-2xl flex flex-col h-[580px] shadow-xl overflow-hidden shadow-gold/5 animate-fade-in">
      {/* Assistant Header */}
      <div className="bg-bg-obsidian/80 px-4 py-3 border-b border-border-dark flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-gold/10 p-1.5 rounded-lg border border-gold/20 text-gold animate-pulse">
            <Bot className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center">
              {t.title}
              <Sparkles className="h-3 w-3 text-gold ml-1.5 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-cyber">
              {t.subtitle}
            </p>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="text-slate-cyber hover:text-red-500 p-1.5 rounded-lg hover:bg-bg-obsidian transition-all cursor-pointer"
          title={t.clear}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-obsidian/40">
        {messages.map((m, idx) => {
          const isBot = m.sender === "bot";
          return (
            <div key={idx} className={`flex ${isBot ? "justify-start" : "justify-end"} animate-fade-in`}>
              <div className={`flex items-start space-x-2.5 max-w-[85%] ${!isBot && "flex-row-reverse space-x-reverse"}`}>
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                  isBot
                    ? "bg-gold/10 text-gold border-gold/20"
                    : "bg-bg-graphite text-[#E0E0E0] border-border-dark"
                }`}>
                  {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                {/* Message Balloon */}
                <div className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-md ${
                  isBot
                    ? "bg-bg-graphite border border-border-dark text-[#E0E0E0]"
                    : "bg-gold text-bg-obsidian font-medium"
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span className={`block text-[9px] mt-1.5 text-right font-mono ${isBot ? "text-slate-cyber" : "text-bg-obsidian/75"}`}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 text-gold flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-bg-graphite border border-border-dark text-slate-cyber text-xs px-3.5 py-2.5 rounded-2xl flex items-center space-x-2">
                <RefreshCw className="h-3 w-3 animate-spin text-gold" />
                <span>AquaBot está modelando su respuesta...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="p-3 border-t border-border-dark bg-bg-obsidian/20 flex flex-wrap gap-1.5">
        {[
          { text: t.quickPermits },
          { text: t.quickGeophysics },
          { text: t.quickPump }
        ].map((chip, i) => {
          const text = chip.text;
          return (
            <button
              key={i}
              onClick={() => handleSendMessage(text)}
              disabled={isLoading}
              className="bg-bg-graphite hover:bg-[#1C1C1F] text-[#E0E0E0] text-[10px] px-2.5 py-1 rounded-full border border-border-dark transition-all cursor-pointer disabled:opacity-50"
            >
              {text}
            </button>
          );
        })}
      </div>

      {/* Chat Input form */}
      <div className="p-3 border-t border-border-dark bg-bg-obsidian flex space-x-2">
        <input
          type="text"
          id="chat-query-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage(inputText);
          }}
          placeholder={t.placeholder}
          disabled={isLoading}
          className="bg-bg-graphite border border-border-dark text-xs text-white rounded-xl px-3 py-2 flex-1 focus:outline-none focus:border-gold disabled:opacity-60"
        />
        <button
          id="send-chat-btn"
          onClick={() => handleSendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
          className="bg-gold hover:bg-gold-light text-bg-obsidian px-3.5 py-2 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Small Legal disclaimer bottom margin */}
      <div className="bg-bg-obsidian border-t border-border-dark px-3 py-2 flex items-start space-x-1.5">
        <ShieldAlert className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
        <p className="text-[9px] text-slate-cyber leading-snug font-sans">
          {t.warning}
        </p>
      </div>
    </div>
  );
}
