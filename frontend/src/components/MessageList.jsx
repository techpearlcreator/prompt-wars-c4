import React, { useRef, useEffect } from 'react';
import { Sparkles, User } from 'lucide-react';
import TypingIndicator from './TypingIndicator';

/**
 * MessageList Component
 * Displays the scrollable message thread.
 */
export default function MessageList({ messages, isTyping }) {
  const containerRef = useRef(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4 select-none">
          <div className="w-16 h-16 rounded-full bg-stadium-navy-card border border-stadium-gold/30 flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-stadium-gold animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stadium-gold-soft">Welcome to MetLife Stadium!</h2>
            <p className="text-sm text-slate-400 max-w-sm mt-1">
              Ask me anything about today's live Argentina vs. Australia game (lineups, VAR reviews, goals, and rules).
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center max-w-md pt-2">
            {[
              "What formation is Argentina using today?",
              "Who is playing #10?",
              "Explain offside rules",
              "Who scored for Argentina?"
            ].map((hint, idx) => (
              <div 
                key={idx}
                className="px-3 py-1.5 rounded-full bg-stadium-navy-card hover:bg-stadium-navy-light text-xs text-stadium-gold/80 border border-stadium-navy-light cursor-pointer transition-colors shadow-sm"
                onClick={() => {
                  // Simulate user typing hint
                  const input = document.getElementById('chat-user-input');
                  if (input) {
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                    nativeInputValueSetter.call(input, hint);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.focus();
                  }
                }}
              >
                {hint}
              </div>
            ))}
          </div>
        </div>
      ) : (
        messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={index}
              className={`flex items-start space-x-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for AI */}
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-stadium-gold flex items-center justify-center shadow border border-stadium-gold-dark/30 shrink-0">
                  <Sparkles className="w-4 h-4 text-stadium-navy-deep" />
                </div>
              )}

              {/* Message Bubble */}
              <div className={`flex flex-col max-w-[80%] md:max-w-[70%]`}>
                <div 
                  className={`px-4 py-3 rounded-2xl shadow-md border ${
                    isUser 
                      ? 'bg-stadium-gold border-stadium-gold-dark/40 text-stadium-navy-deep rounded-tr-none' 
                      : 'bg-stadium-navy-bubble border-stadium-navy-light/40 text-slate-100 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">{msg.text}</p>
                </div>
                
                {/* Timestamp */}
                <span className={`text-[10px] text-slate-400 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Avatar for User */}
              {isUser && (
                <div className="w-8 h-8 rounded-full bg-stadium-navy-card border border-stadium-navy-light flex items-center justify-center shrink-0 shadow">
                  <User className="w-4 h-4 text-stadium-gold" />
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="flex items-start space-x-2.5 justify-start">
          <div className="w-8 h-8 rounded-full bg-stadium-gold flex items-center justify-center shadow shrink-0">
            <Sparkles className="w-4 h-4 text-stadium-navy-deep" />
          </div>
          <TypingIndicator />
        </div>
      )}
    </div>
  );
}
