import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, User, ThumbsUp, ThumbsDown, Receipt, ShoppingBag, Trophy, Check, X, MapPin } from 'lucide-react';
import TypingIndicator from './TypingIndicator';
import { sendMessageFeedback, submitTriviaAnswer } from '../services/api';

/**
 * MessageList Component
 * Displays the scrollable message thread with interactive poll cards, live trivia cards, receipt invoices, custom jerseys, and RAG wayfinding decorators.
 */
export default function MessageList({ messages, isTyping, ratingThanksText, matchId }) {
  const containerRef = useRef(null);
  const [ratedMessages, setRatedMessages] = useState({});
  const [pollVotes, setPollVotes] = useState({});
  const [triviaVotes, setTriviaVotes] = useState({}); // maps questionId -> { selectedIndex, correctIndex, isCorrect }

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

  const getMockPollResults = (pollId, options) => {
    const seed = pollId.charCodeAt(pollId.length - 1) || 7;
    let percentages = [];
    if (options.length === 2) {
      const p1 = (seed * 8) % 40 + 40;
      percentages = [p1, 100 - p1];
    } else {
      const p1 = (seed * 9) % 30 + 45;
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

  const handleTriviaClick = async (questionId, selectedIndex) => {
    if (triviaVotes[questionId]) return;

    const username = localStorage.getItem('fifa_fan_handle') || 'GuestFan';
    try {
      const res = await submitTriviaAnswer({
        matchId: matchId || 'fifa_2026_001',
        username,
        questionId,
        selectedIndex
      });

      setTriviaVotes(prev => ({
        ...prev,
        [questionId]: {
          selectedIndex,
          correctIndex: res.correctIndex,
          isCorrect: res.correct
        }
      }));

      // Trigger standard leaderboard reload events if present
      const event = new CustomEvent('trivia_score_updated');
      window.dispatchEvent(event);
    } catch (err) {
      console.error("Failed to submit trivia answer:", err);
    }
  };

  /**
   * Parses text and renders custom inline badges for wayfinding emojis.
   */
  const renderMessageContent = (text) => {
    if (typeof text !== 'string') return text;

    // 1. Check for Stadium Seating Map wayfinding Match
    const mapRegex = /\[STADIUM_MAP:\s*([^,]+),\s*section:\s*([^,]+),\s*target:\s*([^,]+),\s*eta:\s*([^,]+),\s*distance:\s*([^\]]+)\]/;
    const mapMatch = text.match(mapRegex);

    if (mapMatch) {
      const [_, venue, section, target, eta, distance] = mapMatch;
      
      const sectionCoordsMap = {
        "112": { x: 75, y: 70, label: "Section 112" },
        "104": { x: 25, y: 30, label: "Section 104" },
        "128": { x: 25, y: 75, label: "Section 128" },
        "143": { x: 75, y: 25, label: "Section 143" }
      };

      const targetCoordsMap = {
        "restroom": { x: 70, y: 72, label: "🚻 Restroom (Sec 112)" },
        "restroom_104": { x: 28, y: 28, label: "🚻 Restroom (Sec 104)" },
        "pizza": { x: 80, y: 65, label: "🍕 Pizza Stand (Sec 114)" },
        "pizza_324": { x: 20, y: 80, label: "🍕 Pizza Stand (Sec 324)" },
        "elevator": { x: 72, y: 68, label: "🛗 Elevator (Sec 112)" },
        "gate_c": { x: 78, y: 62, label: "🚧 Gate C Outflow" }
      };

      const start = sectionCoordsMap[section.trim()] || sectionCoordsMap["112"];
      
      let tKey = target.trim().toLowerCase();
      let targetCoord = targetCoordsMap["restroom"];
      if (tKey === 'restroom' && section.trim() === '104') {
        targetCoord = targetCoordsMap["restroom_104"];
      } else if (tKey === 'restroom') {
        targetCoord = targetCoordsMap["restroom"];
      } else if (tKey === 'pizza' && text.includes('324')) {
        targetCoord = targetCoordsMap["pizza_324"];
      } else if (tKey === 'pizza') {
        targetCoord = targetCoordsMap["pizza"];
      } else if (tKey === 'elevator') {
        targetCoord = targetCoordsMap["elevator"];
      } else {
        targetCoord = targetCoordsMap["gate_c"];
      }

      return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 my-2.5 shadow-xl space-y-3.5 max-w-sm select-none text-slate-100 font-sans">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-1.5 text-stadium-gold font-bold uppercase tracking-wider text-xs">
              <MapPin className="w-4 h-4 text-stadium-gold" />
              <span>Wayfinding Seat Map</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[130px]">{venue}</span>
          </div>

          {/* 2D Stadium Map Diagram */}
          <div className="relative w-full h-[180px] bg-slate-950/70 rounded-xl border border-slate-800/80 overflow-hidden">
            {/* Grid background lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-15"></div>

            {/* Seating Ring Oval */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[120px] rounded-full border-[3px] border-slate-700/50 bg-slate-900/40 flex items-center justify-center">
              {/* Inner pitch field grass */}
              <div className="w-[120px] h-[55px] rounded-full border border-emerald-500/20 bg-emerald-600/10 flex items-center justify-center relative">
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-emerald-500/10"></div>
                <div className="w-8 h-8 rounded-full border border-emerald-500/10 absolute"></div>
              </div>
            </div>

            {/* Quadrant Section Labels */}
            <div className="absolute text-[8px] font-bold text-slate-600 top-6 left-12">SEC 104</div>
            <div className="absolute text-[8px] font-bold text-slate-600 top-6 right-12">SEC 143</div>
            <div className="absolute text-[8px] font-bold text-slate-600 bottom-6 left-12">SEC 128</div>
            <div className="absolute text-[8px] font-bold text-slate-600 bottom-6 right-12">SEC 112</div>

            {/* SVG Path Route with animated dash */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <style>{`
                  @keyframes dash {
                    to {
                      stroke-dashoffset: -20;
                    }
                  }
                  .route-line {
                    stroke: #fbbf24;
                    stroke-width: 2.5;
                    stroke-dasharray: 6,4;
                    animation: dash 1s linear infinite;
                  }
                `}</style>
              </defs>
              <line 
                x1={`${start.x}%`} 
                y1={`${start.y}%`} 
                x2={`${targetCoord.x}%`} 
                y2={`${targetCoord.y}%`} 
                className="route-line" 
              />
            </svg>

            {/* Blinking Seat Marker Radar Beacon */}
            <div 
              style={{ left: `${start.x}%`, top: `${start.y}%` }} 
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            >
              <div className="relative flex h-3.5 w-3.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 border border-white"></span>
              </div>
              <span className="absolute left-4 -top-1 px-1 bg-amber-500/90 text-slate-950 text-[8px] font-black rounded uppercase select-none pointer-events-none">
                SEAT
              </span>
            </div>

            {/* Destination Target Marker */}
            <div 
              style={{ left: `${targetCoord.x}%`, top: `${targetCoord.y}%` }} 
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-semibold border-2 border-slate-900 shadow-md">
                <span className="text-[10px]">{targetCoord.label.split(' ')[0]}</span>
              </div>
              <span className="absolute left-6 -top-1 px-1.5 py-0.5 bg-emerald-500/90 text-slate-950 text-[7px] font-black rounded uppercase tracking-wider whitespace-nowrap select-none pointer-events-none">
                GOAL
              </span>
            </div>
          </div>

          {/* Route info legend footer */}
          <div className="flex justify-between items-center text-[10px] font-mono bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 leading-tight">
            <div>
              <span className="text-slate-400 block uppercase text-[8px] tracking-wide font-black">Target Location</span>
              <span className="font-bold text-slate-200">{targetCoord.label}</span>
            </div>
            <div className="text-right border-l border-slate-800 pl-3">
              <span className="font-bold text-emerald-400 block">{distance} away</span>
              <span className="text-slate-400 text-[9px] block">~{eta} walk</span>
            </div>
          </div>
        </div>
      );
    }

    // 2. Check for Concessions Receipt Match
    const receiptRegex = /\[RECEIPT:\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^\]]+)\]/;
    const receiptMatch = text.match(receiptRegex);
    
    if (receiptMatch) {
      const [_, id, itemName, qty, price, type, section, eta] = receiptMatch;
      return (
        <div className="bg-white border-2 border-dashed border-slate-300 text-slate-800 rounded-xl p-4 my-2 shadow-lg space-y-4 max-w-sm font-mono text-xs select-none">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold uppercase tracking-wider">
              <Receipt className="w-4 h-4 text-stadium-gold-dark" />
              <span>Concession Ticket</span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">{id}</span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Method:</span>
              <span className="font-bold text-slate-900 uppercase">{type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Seating:</span>
              <span className="font-bold text-slate-900">{section}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Est. Time:</span>
              <span className="font-bold text-emerald-600">{eta}</span>
            </div>
          </div>

          <div className="border-t border-b border-slate-200 py-2.5 my-2 space-y-1">
            <div className="flex justify-between font-bold text-slate-700 text-[10px] uppercase">
              <span>Item Description</span>
              <span>Qty</span>
              <span>Total</span>
            </div>
            <div className="flex justify-between text-slate-800 font-semibold">
              <span className="truncate max-w-[160px]">{itemName}</span>
              <span>{qty}</span>
              <span>{price}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1">
            <span>TOTAL COST:</span>
            <span>{price}</span>
          </div>

          <div className="flex flex-col items-center pt-2.5 space-y-1.5">
            <div className="flex h-9 w-full bg-white border border-slate-300 py-1.5 px-3.5 justify-between items-center rounded overflow-hidden">
              {[1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2].map((width, idx) => (
                <div 
                  key={idx} 
                  className="h-full bg-slate-900 shrink-0" 
                  style={{ width: `${width * 1.6}px`, opacity: idx % 2 === 0 ? 1 : 0 }}
                ></div>
              ))}
            </div>
            <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">SCAN TO PICKUP</span>
          </div>
        </div>
      );
    }

    // 2. Check for Custom Jersey Print Match
    const merchRegex = /\[MERCH_VOUCHER:\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^\]]+)\]/;
    const merchMatch = text.match(merchRegex);

    if (merchMatch) {
      const [_, id, teamName, custName, custNum, size, price, location] = merchMatch;
      const isArg = teamName.trim() === 'Argentina';

      return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 my-2 shadow-xl space-y-4 max-w-sm select-none text-slate-100">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-1.5 text-stadium-gold font-bold uppercase tracking-wider text-xs">
              <ShoppingBag className="w-4 h-4 text-stadium-gold" />
              <span>Custom Merch Voucher</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">{id.substring(0, 10)}</span>
          </div>

          <div className="grid grid-cols-5 gap-3 items-center">
            <div className="col-span-2 relative w-20 h-24 bg-transparent shrink-0 mx-auto flex items-center justify-center">
              <div 
                className={`relative w-14 h-20 flex flex-col items-center justify-center rounded-t-md shadow-lg overflow-hidden border border-white/10 ${
                  isArg 
                    ? 'bg-[linear-gradient(90deg,_#38bdf8_20%,_#ffffff_20%,_#ffffff_40%,_#38bdf8_40%,_#38bdf8_60%,_#ffffff_60%,_#ffffff_80%,_#38bdf8_80%)]' 
                    : 'bg-[#1e3a8a] border-t-2 border-[#fbbf24]'
                }`}
              >
                <span className={`text-[8px] font-black tracking-widest absolute top-3 uppercase px-1 rounded-sm ${
                  isArg ? 'bg-slate-900 text-stadium-gold' : 'text-slate-100 bg-[#fbbf24]/20'
                }`}>
                  {custName.substring(0, 7)}
                </span>
                <span className={`text-2xl font-black ${
                  isArg ? 'text-slate-900' : 'text-[#fbbf24]'
                } mt-3`}>
                  {custNum}
                </span>

                <div 
                  className={`absolute top-0 -left-3.5 w-4 h-7 rotate-12 rounded-l-md origin-top-right border-l border-white/5 ${
                    isArg ? 'bg-[#38bdf8]' : 'bg-[#1e3a8a]'
                  }`}
                ></div>
                <div 
                  className={`absolute top-0 -right-3.5 w-4 h-7 -rotate-12 rounded-r-md origin-top-left border-r border-white/5 ${
                    isArg ? 'bg-[#38bdf8]' : 'bg-[#1e3a8a]'
                  }`}
                ></div>
              </div>
            </div>

            <div className="col-span-3 text-[11px] space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Team:</span>
                <span className="font-bold text-slate-200">{teamName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Size:</span>
                <span className="font-bold text-slate-200">{size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Price:</span>
                <span className="font-bold text-stadium-gold-light">{price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-amber-500 animate-pulse">PRINTING</span>
              </div>
              <p className="text-[9px] text-slate-400 leading-tight border-t border-slate-800 pt-1 mt-1 truncate">
                Locker: {location}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center pt-1.5 space-y-1">
            <div className="flex h-8 w-full bg-white py-1 px-3.5 justify-between items-center rounded overflow-hidden">
              {[2, 1, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2].map((width, idx) => (
                <div 
                  key={idx} 
                  className="h-full bg-slate-900 shrink-0" 
                  style={{ width: `${width * 1.5}px`, opacity: idx % 2 === 0 ? 1 : 0 }}
                ></div>
              ))}
            </div>
            <span className="text-[9px] text-slate-400 font-bold tracking-wider">PRINT QUEUE VOUCHER</span>
          </div>
        </div>
      );
    }

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
          const triviaAns = triviaVotes[msg.id];
          
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
                ) : isAi && msg.isTrivia ? (
                  // 2. Render Trivia Message Bubble (Phase 15 Card)
                  <div className="bg-gradient-to-r from-stadium-navy-card to-stadium-navy-bubble border border-stadium-gold/50 rounded-2xl p-4 shadow-md rounded-tl-none space-y-3.5 w-full">
                    <div>
                      <div className="flex items-center space-x-1.5 text-stadium-gold text-[10px] font-black uppercase tracking-wider select-none">
                        <Trophy className="w-4 h-4 text-stadium-gold" />
                        <span>Live Stadium Trivia</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100 mt-2">{msg.text ? msg.text.replace('🧠 LIVE FAN TRIVIA:\n', '') : ''}</h4>
                    </div>

                    <div className="space-y-2">
                      {msg.options && msg.options.map((opt, optIdx) => {
                        const isSelected = triviaAns?.selectedIndex === optIdx;
                        const isCorrect = triviaAns?.correctIndex === optIdx;
                        const hasAnswered = !!triviaAns;

                        let styleClass = "border border-stadium-navy-light bg-stadium-navy-deep hover:border-stadium-gold/80 text-slate-300 hover:text-stadium-gold cursor-pointer";
                        if (hasAnswered) {
                          if (isCorrect) {
                            styleClass = "bg-green-500/10 border-green-500 text-green-400";
                          } else if (isSelected) {
                            styleClass = "bg-red-500/10 border-red-500 text-red-400";
                          } else {
                            styleClass = "border-stadium-navy-light/40 bg-stadium-navy-deep/20 text-slate-500 opacity-60";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={hasAnswered}
                            onClick={() => handleTriviaClick(msg.id, optIdx)}
                            className={`w-full min-h-[40px] py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all ${styleClass}`}
                          >
                            <span>{opt}</span>
                            {hasAnswered && isCorrect && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                            {hasAnswered && isSelected && !isCorrect && <X className="w-4 h-4 text-red-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {triviaAns && msg.options && (
                      <p className={`text-[10px] font-bold ${triviaAns.isCorrect ? 'text-green-400 animate-pulse' : 'text-red-400'}`}>
                        {triviaAns.isCorrect 
                          ? "🎉 Correct! +10 points added to your score." 
                          : `❌ Incorrect! The correct answer was: ${msg.options[triviaAns.correctIndex]}`}
                      </p>
                    )}
                  </div>
                ) : (
                  // 3. Render Standard Bubble / Receipt Bubble / Merch Bubble
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
                  
                  {isAi && msg.id && !msg.isPoll && !msg.isTrivia && !msg.text.includes('[RECEIPT:') && !msg.text.includes('[MERCH_VOUCHER:') && (
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
