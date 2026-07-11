import React, { useState } from 'react';
import MessageList from './MessageList';
import InputBox from './InputBox';
import { sendChatMessage } from '../services/api';
import { RefreshCw, AlertCircle } from 'lucide-react';

/**
 * ChatWindow Component
 * Manages chat flow, state, and errors.
 */
export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  const handleSendMessage = async (text) => {
    setError(null);
    const userMsg = {
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const data = await sendChatMessage(text);
      const aiMsg = {
        sender: 'ai',
        text: data.response,
        timestamp: data.timestamp || new Date().toISOString()
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err.message || "Failed to reach the AI assistant. Please check your connection and try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    setIsTyping(false);
  };

  return (
    <section 
      id="chat-window"
      aria-label="FIFA Chat Assistant" 
      className="flex flex-col h-full bg-stadium-navy-card rounded-3xl border border-stadium-navy-light/60 overflow-hidden shadow-2xl"
    >
      {/* Chat header */}
      <header className="flex justify-between items-center px-6 py-4 bg-stadium-navy-bubble border-b border-stadium-navy-light/60">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-stadium-navy-bubble"></span>
            <div className="w-10 h-10 rounded-xl bg-stadium-navy-light flex items-center justify-center border border-stadium-gold/20">
              <span className="text-stadium-gold font-bold text-base">26</span>
            </div>
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold text-slate-100">Live Match Assistant</h1>
            <p className="text-[11px] text-slate-400">Argentina vs Australia • Min 67</p>
          </div>
        </div>
        
        <button 
          onClick={handleClearChat}
          title="Clear Chat History"
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-stadium-navy-light hover:bg-stadium-navy-accent text-slate-400 hover:text-stadium-gold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Message space */}
      <MessageList messages={messages} isTyping={isTyping} />

      {/* Error alert */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center space-x-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Chat input */}
      <footer className="p-4 bg-stadium-navy-bubble border-t border-stadium-navy-light/60">
        <InputBox onSendMessage={handleSendMessage} disabled={isTyping} />
      </footer>
    </section>
  );
}
