import React from 'react';

/**
 * TypingIndicator Component
 * Renders three animated pulsing gold dots.
 */
export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 px-4 py-3 bg-stadium-navy-bubble text-slate-100 rounded-2xl rounded-tl-none max-w-xs shadow-md border border-stadium-navy-light/40">
      <span className="text-xs text-stadium-gold-soft mr-1 font-medium select-none">AI is thinking</span>
      <div className="flex space-x-1 items-center h-4">
        <span className="w-1.5 h-1.5 bg-stadium-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-1.5 h-1.5 bg-stadium-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-1.5 h-1.5 bg-stadium-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
    </div>
  );
}
