import React, { useState, useRef } from 'react';
import { SendHorizontal } from 'lucide-react';

/**
 * InputBox Component
 * User text input zone with validations.
 */
export default function InputBox({ onSendMessage, disabled }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex items-center space-x-2 p-2 sm:p-3 bg-stadium-navy-card rounded-2xl border border-stadium-navy-light/60 focus-within:border-stadium-gold/50 shadow-lg transition-all"
    >
      <input
        ref={inputRef}
        id="chat-user-input"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Please wait for AI response..." : "Ask about VAR rules, lineups, scores..."}
        disabled={disabled}
        aria-label="Ask a question about the match"
        autoComplete="off"
        className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-400 px-3 py-2 text-sm sm:text-base disabled:opacity-50"
      />
      <button
        id="btn-send-message"
        type="submit"
        disabled={disabled || !text.trim()}
        aria-label="Send message"
        className="flex items-center justify-center w-11 h-11 rounded-xl bg-stadium-gold hover:bg-stadium-gold-light text-stadium-navy-deep disabled:bg-stadium-navy-light/50 disabled:text-slate-400 transition-colors cursor-pointer shrink-0"
      >
        <SendHorizontal className="w-5 h-5" />
      </button>
    </form>
  );
}
