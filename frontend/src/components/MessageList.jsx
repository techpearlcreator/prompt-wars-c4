import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, User, ThumbsUp, ThumbsDown } from 'lucide-react';
import TypingIndicator from './TypingIndicator';
import { sendMessageFeedback } from '../services/api';

/**
 * MessageList Component
 * Displays the scrollable message thread with interactive poll cards and RAG wayfinding decorators.
 */
export default function MessageList({ messages, isTyping, ratingThanksText }) {
  const containerRef = useRef(null);
  const [ratedMessages, setRatedMessages] = useState({});
  const [pollVotes, setPollVotes] = useState({}); // { [pollId]: optionText }

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleRate = async (messageId, rating) => {
    if (ratedMessages[messageId]) return;
    
    setRatedMessages(prev => ({
      ...prev,
      [messageId]: rating
    }));

    try {
      await sendMessageFeedback(messageId, rating === 'up' ? 'helpful' : 'not_helpful');
    } catch (err) {
      console.error("Failed to submit message feedback", err);
    }
  };

  // Mock voting distribution for visual effect when fan votes
  const getMockPollResults = (pollId, options) => {
    // Deterministic mock percentages based on poll ID length/options
    const seed = pollId.charCodeAt(pollId.length - 1) || 7;
    let percentages = [];
    if (options.length === 2) {
      const p1 = (seed * 8) % 40 + 40; // 40-80%
      percentages = [p1, 100 - p1];
    } else {
      const p1 = (seed * 9) % 30 + 45; // 45-75%
      const p2 = Math.round((100 - p1) * 0.6);
      const p3 = 100 - p1 - p2;
      percentages = [p1, p2, p3];
    }
    return percentages;
  };

  const handlePollVote = (pollId, optionText) => {
    setPollVotes(prev => ({
      ...prev,
      [pollId]: optionText
    }));
  };

  /**
   * Parses text and renders custom inline badges for wayfinding emojis.
   */
  const renderMessageContent = (text) => {
    if (typeof text !== 'string') return text;

    const parts = text.split(/(🚻|🛗|🚧|🍕)/g);
    return parts.map((part, idx) => {
      if (part === '🚻') {
        return (
          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold mx-1 select-none">
            🚻 Restroom
          </span>
        );
      }
      if (part === '🛗') {
        return (
          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold mx-1 select-none">
            🛗 Elevator
          </span>
        );
      }
      if (part === '🚧') {
        return (
          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold mx-1 select-none">
            🚧 Gate
          </span>
        );
      }
      if (part === '🍕') {
        return (
          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/20 text-[10px] font-bold mx-1 select-none">
            🍕 Food Zone
          </span>
        );
      }
      return part;
    });
  };

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
            <h2 className="text-lg font-bold text-stadium-gold-soft">Welcome to the Stadium Assistant</h2>
            <p className="text-sm text-slate-400 max-w-sm mt-1">
              Ask me anything about today's live game rules, lineups, VAR decisions, or venue accessibility.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center max-w-md pt-2">
            {[
              "Where is the nearest restroom from Gate C?",
              "Closest elevator to Section 112?",
              "What formation is Argentina using?",
              "Where can I buy pizza?"
            ].map((hint, idx) => (
              <div 
                key={idx}
                className="px-3 py-1.5 rounded-full bg-stadium-navy-card hover:bg-stadium-navy-light text-xs text-stadium-gold/80 border border-stadium-navy-light cursor-pointer transition-colors shadow-sm"
                onClick={() => {
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
          const isAi = !isUser;
          const userRating = ratedMessages[msg.id];
          const votedOption = pollVotes[msg.id];
          
          return (
            <div 
              key={index}
              className={`flex items-start space-x-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for AI */}
              {isAi && (
                <div className="w-8 h-8 rounded-full bg-stadium-gold flex items-center justify-center shadow border border-stadium-gold-dark/30 shrink-0">
                  <Sparkles className="w-4 h-4 text-stadium-navy-deep" />
                </div>
              )}

              {/* Message Bubble Column */}
              <div className={`flex flex-col max-w-[80%] md:max-w-[70%]`}>
                
                {/* 1. Render Poll Message Bubble */}
                {isAi && msg.isPoll ? (
                  <div className="bg-gradient-to-r from-stadium-navy-card to-stadium-navy-bubble border border-stadium-gold/50 rounded-2xl p-4 shadow-md rounded-tl-none space-y-3.5 w-full">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-stadium-gold text-stadium-navy-deep text-[9px] font-black uppercase tracking-wider select-none">
                        Community Poll
                      </span>
                      <h4 className="text-sm font-bold text-slate-100 mt-2">{msg.text.replace('📊 LIVE FAN POLL:\n', '')}</h4>
                    </div>

                    <div className="space-y-2">
                      {msg.options.map((opt, optIdx) => {
                        const results = getMockPollResults(msg.id, msg.options);
                        const percent = results[optIdx] || 0;
                        const isSelected = votedOption === opt;
                        
                        return votedOption ? (
                          // Result View
                          <div 
                            key={optIdx} 
                            className="relative h-10 w-full rounded-xl bg-stadium-navy-deep border border-stadium-navy-light/40 overflow-hidden flex items-center px-3.5 justify-between text-xs"
                          >
                            <div 
                              style={{ width: `${percent}%` }}
                              className={`absolute left-0 top-0 bottom-0 ${
                                isSelected ? 'bg-stadium-gold/15' : 'bg-slate-500/5'
                              } transition-all duration-1000`}
                            ></div>
                            <span className={`relative font-semibold ${isSelected ? 'text-stadium-gold' : 'text-slate-300'}`}>
                              {opt} {isSelected && '✓'}
                            </span>
                            <span className="relative font-bold text-slate-400">{percent}%</span>
                          </div>
                        ) : (
                          // Vote Input View
                          <button
                            key={optIdx}
                            onClick={() => handlePollVote(msg.id, opt)}
                            className="w-full h-10 rounded-xl border border-stadium-navy-light/75 hover:border-stadium-gold/80 bg-stadium-navy-deep hover:bg-stadium-gold/5 text-left px-3.5 text-xs font-semibold text-slate-300 hover:text-stadium-gold transition-all cursor-pointer"
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // 2. Render Standard Text Bubble
                  <div 
                    className={`px-4 py-3 rounded-2xl shadow-md border ${
                      isUser 
                        ? 'bg-stadium-gold border-stadium-gold-dark/40 text-stadium-navy-deep rounded-tr-none' 
                        : 'bg-stadium-navy-bubble border-stadium-navy-light/40 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    <div className="text-sm md:text-base leading-relaxed whitespace-pre-line">
                      {renderMessageContent(msg.text)}
                    </div>
                  </div>
                )}
                
                {/* Timestamp and Feedback loop for AI messages */}
                <div className={`flex items-center justify-between mt-1 px-1 text-[10px] text-slate-400`}>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {isAi && msg.id && !msg.isPoll && (
                    <div className="flex items-center space-x-3 ml-4 bg-stadium-navy-deep/40 px-2 py-0.5 rounded-full border border-stadium-navy-light/30">
                      {userRating ? (
                        <span className="text-[9px] text-stadium-gold animate-fade-in font-medium">
                          {ratingThanksText || "Thanks!"}
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRate(msg.id, 'up')}
                            className="hover:text-stadium-gold transition-colors cursor-pointer"
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRate(msg.id, 'down')}
                            className="hover:text-red-400 transition-colors cursor-pointer"
                            title="Not Helpful"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
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
