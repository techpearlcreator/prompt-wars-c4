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

  // Map suggested routing states (Phase 19)
  const [mapViews, setMapViews] = useState({}); // Stores 'seating' or 'suggested' keyed by messageId
  const [mapRoutes, setMapRoutes] = useState({}); // Stores 'clear' or 'main' keyed by messageId
  const [selectedTargets, setSelectedTargets] = useState({}); // Stores selected target index keyed by messageId
  const [navigationActive, setNavigationActive] = useState({}); // { [msgId]: boolean }

  const getRestroomsForSection = (sec) => {
    const s = sec.trim();
    if (s === "104") {
      return [
        {
          id: "rr_1",
          x: 28,
          y: 28,
          capacity: 15,
          color: "#10b981", // Green
          label: "Restroom A (Sec 104)",
          directions: [
            "Exit Section 104 seating tunnel.",
            "Walk straight 10 meters into the west concourse.",
            "Take a right at the beverage kiosk.",
            "Restroom is 5 meters ahead on your left."
          ]
        },
        {
          id: "rr_2",
          x: 22,
          y: 65,
          capacity: 68,
          color: "#f97316", // Orange
          label: "Restroom B (Sec 128)",
          directions: [
            "Exit Section 104 seating tunnel.",
            "Walk straight for 35 meters down the concourse hallway.",
            "Turn right at the Bud's Burger counter.",
            "The restroom is on your left next to the elevator lobby."
          ]
        }
      ];
    }
    // Default to Section 112 restrooms
    return [
      {
        id: "rr_1",
        x: 70,
        y: 72,
        capacity: 20,
        color: "#10b981", // Green
        label: "Restroom A (Sec 112)",
        directions: [
          "Leave Section 112 seating tunnel.",
          "Go straight 10 meters towards the main concourse corridor.",
          "Turn right at Nonna's Pizza counter.",
          "The restroom entry is on your left next to Elevator B."
        ]
      },
      {
        id: "rr_2",
        x: 52,
        y: 80,
        capacity: 55,
        color: "#f97316", // Orange
        label: "Restroom B (Sec 120)",
        directions: [
          "Exit Section 112 seating area.",
          "Walk straight for 15 meters on the lower corridor.",
          "Take a left at Bud's Burger stand.",
          "Go straight for 10 meters; restroom is opposite Section 120."
        ]
      },
      {
        id: "rr_3",
        x: 82,
        y: 55,
        capacity: 85,
        color: "#ef4444", // Red
        label: "Restroom C (Gate C)",
        directions: [
          "Exit Section 112 and enter the concourse walkway.",
          "Walk straight 25 meters past the apparel store.",
          "Turn left at the Gate C ticket checkpoints.",
          "The restroom is on the right, next to the first aid booth."
        ]
      }
    ];
  };

  const getTargetsForSection = (sec, target) => {
    const s = sec.trim();
    const t = target.trim().toLowerCase();

    if (t === 'restroom' || t === 'toilet' || t === 'bathroom' || t === 'wc') {
      return getRestroomsForSection(sec);
    }
    
    if (t === 'pizza' || t === 'food') {
      return [
        {
          id: "fd_1",
          x: 80,
          y: 65,
          capacity: 70,
          color: "#f97316", // Orange
          label: "Nonna's Pizza (Sec 114)",
          directions: [
            "Exit your seating section and head right.",
            "Walk 15 meters down the main corridor.",
            "Nonna's Pizza is right next to Restroom A."
          ]
        },
        {
          id: "fd_2",
          x: 20,
          y: 80,
          capacity: 10,
          color: "#10b981", // Green
          label: "Nonna's Pizza (Sec 324)",
          directions: [
            "Exit section corridor and take the nearest elevator to Level 3.",
            "Turn left upon exiting the elevator lobby.",
            "Nonna's Pizza Stand is 10 meters straight ahead."
          ]
        }
      ];
    }

    // Default target list (e.g. Elevators, Gate C)
    return [
      {
        id: "tg_1",
        x: 72,
        y: 68,
        capacity: 40,
        color: "#eab308", // Yellow
        label: "Elevator Lobby (Sec 112)",
        directions: [
          "Exit seating sector 112 corridor.",
          "Walk 8 meters straight towards the West Lobby entrance.",
          "Elevator shafts are located immediately behind the information desk."
        ]
      },
      {
        id: "tg_2",
        x: 78,
        y: 62,
        capacity: 90,
        color: "#ef4444", // Red
        label: "Gate C Exit Outflow",
        directions: [
          "Follow the exit signs out of the seating section.",
          "Proceed straight for 30 meters past the food concessions.",
          "Gate C portals are straight ahead through the security arches."
        ]
      }
    ];
  };

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
  const renderMessageContent = (text, msgId) => {
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

      const currentView = mapViews[msgId] || 'seating';
      const currentRoute = mapRoutes[msgId] || 'clear';

      const toggleView = () => {
        setMapViews(prev => ({
          ...prev,
          [msgId]: currentView === 'seating' ? 'suggested' : 'seating'
        }));
      };

      const selectRoute = (route) => {
        setMapRoutes(prev => ({
          ...prev,
          [msgId]: route
        }));
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

      // Generate curved pathway around center field (Google Maps corridor pathing)
      const getPathData = (x1, y1, x2, y2) => {
        const cx = 50;
        const cy = 50;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const distToCenter = Math.sqrt(Math.pow(mx - cx, 2) + Math.pow(my - cy, 2));

        let ctrlX = mx;
        let ctrlY = my;
        if (distToCenter < 28) {
          const dx = mx - cx;
          const dy = my - cy;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          ctrlX = cx + (dx / len) * 40;
          ctrlY = cy + (dy / len) * 34;
        }
        return `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`;
      };

      const targetsList = getTargetsForSection(section, target);
      const selectedIndex = selectedTargets[msgId] !== undefined ? selectedTargets[msgId] : 0;
      const activeTarget = targetsList[selectedIndex] || targetsList[0] || targetCoord;
      const activeEmoji = activeTarget.label.split(' ')[0];

      // Suggested Route Concourse View
      if (currentView === 'suggested') {
        const isClear = currentRoute === 'clear';
        const isNavigating = navigationActive[msgId] === true;
        
        // Define paths and info for suggested routes
        const routeAPath = activeTarget.pathD;
        const routeBPath = section === "104"
          ? `M 125 85 L 125 155 L ${activeTarget.x} ${activeTarget.y}`
          : `M 275 155 L 275 85 L ${activeTarget.x} ${activeTarget.y}`;

        const activePath = isClear ? routeAPath : routeBPath;
        const targetName = activeTarget.label.split(' ')[1] || "Facility";

        if (isNavigating) {
          return (
            <div className="w-full max-w-sm bg-slate-900 border border-red-500/40 rounded-2xl p-4 my-2.5 shadow-xl space-y-3.5 select-none text-slate-100 font-sans animate-in zoom-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-1.5 text-red-500 font-black uppercase tracking-wider text-xs animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping mr-1"></div>
                  <span>Live Navigation Active</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[130px]">{venue}</span>
              </div>

              {/* Large Map Viewport */}
              <div className="relative w-full h-[250px] bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
                {/* Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:15px_15px] opacity-10 pointer-events-none"></div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 240">
                  {/* Outer Stadium Ellipse wall */}
                  <ellipse cx="200" cy="120" rx="175" ry="98" fill="#0b1329" stroke="#1e293b" strokeWidth="4" />
                  <ellipse cx="200" cy="120" rx="168" ry="92" fill="none" stroke="#334155" strokeWidth="1.5" opacity="0.6" />

                  {/* Concourse Walkway Corridor (Fill background) */}
                  <ellipse cx="200" cy="120" rx="146" ry="80" fill="none" stroke="#1e293b" strokeWidth="32" opacity="0.75" />

                  {/* Seating Bowl Inner Wall boundary */}
                  <ellipse cx="200" cy="120" rx="130" ry="64" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />

                  {/* Grass Field in Center */}
                  <rect x="152" y="95" width="96" height="50" rx="3" fill="#10b981" fillOpacity="0.08" stroke="#10b981" strokeWidth="1.5" opacity="0.3" />

                  {/* Vomitory seating access tunnels */}
                  <line x1="285" y1="162" x2="305" y2="173" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                  <line x1="115" y1="78" x2="95" y2="67" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                  <line x1="115" y1="162" x2="95" y2="173" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                  <line x1="285" y1="78" x2="305" y2="67" stroke="#334155" strokeWidth="6" strokeLinecap="round" />

                  {/* Selected Active path with crawling dashed overlay */}
                  <path 
                    d={activePath} 
                    fill="none" 
                    stroke={isClear ? "#10b981" : "#ef4444"} 
                    strokeWidth="5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  <path 
                    d={activePath} 
                    fill="none" 
                    stroke="#ffffff" 
                    strokeWidth="1.5" 
                    strokeDasharray="4,4" 
                    className="route-dash-animated" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />

                  {/* Pulse Blue Dot Marker (GPS Start) */}
                  <circle cx={section === "104" ? 125 : 275} cy={section === "104" ? 85 : 155} r="10" fill="#3b82f6" opacity="0.4" className="animate-ping" />
                  <circle cx={section === "104" ? 125 : 275} cy={section === "104" ? 85 : 155} r="5.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                </svg>

                {/* Clickable pins overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div 
                    style={{ 
                      left: `${(activeTarget.x / 400) * 100}%`, 
                      top: `${(activeTarget.y / 240) * 100}%`,
                      transform: 'translate(-50%, -85%)'
                    }} 
                    className="absolute z-20 flex flex-col items-center scale-110"
                  >
                    <div className="relative w-7 h-9 flex items-center justify-center shrink-0">
                      <svg 
                        style={{ color: isClear ? activeTarget.color : "#ef4444" }}
                        className="absolute inset-0 w-full h-full filter drop-shadow-md" 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      </svg>
                      <div className="absolute top-[5px] w-[15px] h-[15px] rounded-full bg-white flex items-center justify-center text-[9px] z-10 shadow-sm">
                        {activeEmoji}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Status Floaters */}
                <div className="absolute bottom-3 left-3 bg-slate-950/80 px-2 py-1 border border-slate-800 rounded-lg text-[9px] font-mono leading-none">
                  <span className="text-slate-400 uppercase text-[7px] block">Your Location</span>
                  <span className="font-bold text-slate-200">Sec {section} Gateway</span>
                </div>

                <div className="absolute top-3 right-3 bg-slate-950/80 px-2 py-1 border border-slate-800 rounded-lg text-[9px] font-mono leading-none">
                  <span className="text-slate-400 uppercase text-[7px] block">Destination</span>
                  <span className="font-bold text-slate-200">{targetName}</span>
                </div>
              </div>

              {/* Navigation Dashboard (Phase 24) */}
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-2 font-sans">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-200">🏃 Estimated Arrival</span>
                  <span className="font-mono text-emerald-400 font-black">{isClear ? "45 Seconds" : "3 Minutes"}</span>
                </div>
                
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1">
                  <span className="text-[7.5px] text-slate-500 uppercase tracking-wider block font-black">Current Step</span>
                  <p className="text-xs font-bold text-slate-100">
                    {section === "104" ? "Turn left at Gate 4 and walk 30m" : "Turn right after Gate 12 and walk 40m"}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Next Checkpoint: Concession Food Court (35m ahead)
                  </p>
                </div>

                <div className="flex justify-between items-center pt-1.5">
                  <div className="flex items-center space-x-1.5 text-[9px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-slate-400">GPS Status:</span>
                    <span className="text-emerald-400 font-bold">Active Navigating</span>
                  </div>
                  <button 
                    onClick={() => setNavigationActive(prev => ({ ...prev, [msgId]: false }))}
                    className="py-2.5 px-4 sm:py-1.5 sm:px-3 rounded-lg bg-red-950 border border-red-500/30 hover:bg-red-900/50 text-red-200 text-[9px] font-black uppercase tracking-wider cursor-pointer shadow transition-all"
                  >
                    Stop Navigation
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 my-2.5 shadow-xl space-y-3.5 select-none text-slate-100 font-sans">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-1.5 text-stadium-gold font-bold uppercase tracking-wider text-xs">
                <MapPin className="w-4 h-4 text-stadium-gold" />
                <span>Suggested Real Routes</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[130px]">{venue}</span>
            </div>

            {/* Graphical Vector Concourse Map */}
            <div className="relative w-full h-[250px] bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
              {/* Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:15px_15px] opacity-10 pointer-events-none"></div>

              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 240">
                {/* Outer Stadium Ellipse wall */}
                <ellipse cx="200" cy="120" rx="175" ry="98" fill="#0b1329" stroke="#1e293b" strokeWidth="4" />
                <ellipse cx="200" cy="120" rx="168" ry="92" fill="none" stroke="#334155" strokeWidth="1.5" opacity="0.6" />

                {/* Concourse Walkway Corridor (Fill background) */}
                <ellipse cx="200" cy="120" rx="146" ry="80" fill="none" stroke="#1e293b" strokeWidth="32" opacity="0.75" />

                {/* Seating Bowl Inner Wall boundary */}
                <ellipse cx="200" cy="120" rx="130" ry="64" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />

                {/* Grass Field in Center */}
                <rect x="152" y="95" width="96" height="50" rx="3" fill="#10b981" fillOpacity="0.08" stroke="#10b981" strokeWidth="1.5" opacity="0.3" />

                {/* Vomitory seating access tunnels */}
                <line x1="285" y1="162" x2="305" y2="173" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                <line x1="115" y1="78" x2="95" y2="67" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                <line x1="115" y1="162" x2="95" y2="173" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                <line x1="285" y1="78" x2="305" y2="67" stroke="#334155" strokeWidth="6" strokeLinecap="round" />

                {/* Animated white crawling dash overlay on active route */}
                <path 
                  d={activePath} 
                  fill="none" 
                  stroke="#ffffff" 
                  strokeWidth="1.2" 
                  strokeDasharray="4,5" 
                  className="route-dash-animated" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />

                {/* Pulse Blue Dot Marker (GPS Start) */}
                <circle cx={section === "104" ? 125 : 275} cy={section === "104" ? 85 : 155} r="10" fill="#3b82f6" opacity="0.3" className="animate-ping" />
                <circle cx={section === "104" ? 125 : 275} cy={section === "104" ? 85 : 155} r="5.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              </svg>

              {/* Clickable pins overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div 
                  style={{ 
                    left: `${(activeTarget.x / 400) * 100}%`, 
                    top: `${(activeTarget.y / 240) * 100}%`,
                    transform: 'translate(-50%, -85%)'
                  }} 
                  className="absolute z-20 flex flex-col items-center scale-110"
                >
                  <div className="relative w-7 h-9 flex items-center justify-center shrink-0">
                    <svg 
                      style={{ color: isClear ? activeTarget.color : "#ef4444" }}
                      className="absolute inset-0 w-full h-full filter drop-shadow-md" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    </svg>
                    <div className="absolute top-[5px] w-[15px] h-[15px] rounded-full bg-white flex items-center justify-center text-[9px] z-10 shadow-sm">
                      {activeEmoji}
                    </div>
                  </div>
                </div>
              </div>

              {/* Float overlays for route status description */}
              <div className="absolute bottom-3 left-3 bg-slate-950/80 px-2 py-1 border border-slate-800 rounded-lg text-[9px] font-mono leading-none">
                <span className="text-slate-400 uppercase text-[7px] block">Start Point</span>
                <span className="font-bold text-slate-200">Sec {section}</span>
              </div>

              <div className="absolute top-3 right-3 bg-slate-950/80 px-2 py-1 border border-slate-800 rounded-lg text-[9px] font-mono leading-none">
                <span className="text-slate-400 uppercase text-[7px] block">Destination</span>
                <span className="font-bold text-slate-200">{targetName}</span>
              </div>
            </div>

            {/* Premium Route Options Flexbox Comparison Row (Phase 26 Side-by-Side) */}
            <div className="flex gap-2 shrink-0">
              {/* Route A Card */}
              <button
                onClick={() => selectRoute('clear')}
                className={`flex-1 flex flex-col p-2 rounded-xl border text-left cursor-pointer transition-all duration-300 outline-none min-w-0 ${
                  isClear
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.08)]'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 w-full">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isClear ? 'border-emerald-400' : 'border-slate-600'
                  }`}>
                    {isClear && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>}
                  </div>
                  <span className={`text-[10px] font-black truncate ${isClear ? 'text-emerald-400' : 'text-slate-200'}`}>
                    Route A (Concourse)
                  </span>
                </div>
                <div className="mt-1 flex justify-between items-baseline w-full">
                  <span className="text-[7.5px] text-slate-400 font-medium">🟢 Low Crowd</span>
                  <span className="text-[9.5px] font-mono font-black text-emerald-400">10% • 1m</span>
                </div>
              </button>

              {/* Route B Card */}
              <button
                onClick={() => selectRoute('main')}
                className={`flex-1 flex flex-col p-2 rounded-xl border text-left cursor-pointer transition-all duration-300 outline-none min-w-0 ${
                  !isClear
                    ? 'border-red-500 bg-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.08)]'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 w-full">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    !isClear ? 'border-red-400' : 'border-slate-600'
                  }`}>
                    {!isClear && <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>}
                  </div>
                  <span className={`text-[10px] font-black truncate ${!isClear ? 'text-red-400' : 'text-slate-200'}`}>
                    Route B (Shortcut)
                  </span>
                </div>
                <div className="mt-1 flex justify-between items-baseline w-full">
                  <span className="text-[7.5px] text-slate-400 font-medium">🔴 Congested</span>
                  <span className="text-[9.5px] font-mono font-black text-red-400">88% • 3m</span>
                </div>
              </button>
            </div>

            {/* Start Live Navigation Action Button (Phase 24) */}
            <button
              onClick={() => setNavigationActive(prev => ({ ...prev, [msgId]: true }))}
              className={`w-full py-3.5 sm:py-2.5 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all duration-300 shadow cursor-pointer text-center ${
                isClear 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_4px_10px_rgba(16,185,129,0.2)]' 
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_4px_10px_rgba(239,68,68,0.2)]'
              }`}
            >
              Start Live Navigation
            </button>

            {/* Live Crowd Density Intelligence */}
            <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800/80 space-y-1.5 text-[9px] font-sans">
              <div className="flex justify-between items-center">
                <span className="text-[7.5px] text-slate-400 uppercase tracking-wide font-black">Gate Crowd Density status</span>
                <span className="px-1 py-0.5 rounded bg-blue-950 text-blue-400 font-extrabold text-[6px]">AI Operations</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[8px] font-mono text-center">
                <div className="p-1 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-500 block text-[6.5px]">Gate A</span>
                  <span className="text-emerald-400 font-bold">🟢 Low (12%)</span>
                </div>
                <div className="p-1 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-500 block text-[6.5px]">Gate B</span>
                  <span className="text-amber-400 font-bold">🟡 Mid (45%)</span>
                </div>
                <div className="p-1 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-500 block text-[6.5px]">Gate C</span>
                  <span className="text-red-400 font-bold">🔴 High (88%)</span>
                </div>
              </div>
              <div className="p-2 rounded bg-amber-500/5 border border-amber-500/20 text-slate-300 text-[8.5px] leading-snug">
                <strong>🤖 AI Suggestion:</strong> Avoid Gate C. Expected delay: 4 minutes due to bottleneck. Concourse Route A bypasses this zone.
              </div>
            </div>

            {/* Back button and alternate details */}
            <div className="flex justify-between items-center text-[10px] font-mono bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 leading-tight">
              <div>
                <span className="text-slate-400 block uppercase text-[8px] tracking-wide font-black">Routing Status</span>
                <span className={`font-bold ${isClear ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isClear ? 'Recommended: Corridor Route' : 'Slow shortcut via Seating'}
                </span>
              </div>
              <button 
                onClick={toggleView}
                className="py-2.5 px-3 sm:py-1.5 sm:px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase text-[9px] cursor-pointer shadow transition-all"
              >
                Back to Seats
              </button>
            </div>
          </div>
        );
      }

      // Default Seating Map View
      const activePathD = getPathData(start.x, start.y, activeTarget.x, activeTarget.y);

      return (
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 my-2.5 shadow-xl space-y-3.5 select-none text-slate-100 font-sans">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-1.5 text-stadium-gold font-bold uppercase tracking-wider text-xs">
              <MapPin className="w-4 h-4 text-stadium-gold" />
              <span>Wayfinding Seat Map</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[130px]">{venue}</span>
          </div>

          {/* Large Legible 2D Concourse Wayfinding Map */}
          <div className="relative w-full h-[170px] sm:h-[220px] bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
            {/* Grid background lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:15px_15px] opacity-10 pointer-events-none"></div>

            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 240">
              <defs>
                <style>{`
                  @keyframes routeDash {
                    to {
                      stroke-dashoffset: -20;
                    }
                  }
                  .route-dash-animated {
                    animation: routeDash 1.2s linear infinite;
                  }
                `}</style>
              </defs>

              {/* Outer Stadium Ellipse wall */}
              <ellipse cx="200" cy="120" rx="175" ry="98" fill="#0b1329" stroke="#1e293b" strokeWidth="4" />
              <ellipse cx="200" cy="120" rx="168" ry="92" fill="none" stroke="#334155" strokeWidth="1.5" opacity="0.6" />

              {/* Concourse Walkway Corridor (Fill background) */}
              <ellipse cx="200" cy="120" rx="146" ry="80" fill="none" stroke="#1e293b" strokeWidth="32" opacity="0.75" />

              {/* Seating Bowl Inner Wall boundary */}
              <ellipse cx="200" cy="120" rx="130" ry="64" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />

              {/* Grass Field in Center */}
              <rect x="152" y="95" width="96" height="50" rx="3" fill="#10b981" fillOpacity="0.08" stroke="#10b981" strokeWidth="1.5" opacity="0.3" />
              <line x1="200" y1="95" x2="200" y2="145" stroke="#10b981" strokeWidth="1" opacity="0.2" />
              <circle cx="200" cy="120" r="16" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.2" />

              {/* Vomitory seating access tunnels */}
              <line x1="285" y1="162" x2="305" y2="173" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              <line x1="115" y1="78" x2="95" y2="67" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              <line x1="115" y1="162" x2="95" y2="173" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              <line x1="285" y1="78" x2="305" y2="67" stroke="#334155" strokeWidth="6" strokeLinecap="round" />

              {/* Seating Section Labels (Static text in seating area) */}
              <text x="125" y="86" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">SEC 104</text>
              <text x="275" y="86" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">SEC 143</text>
              <text x="125" y="162" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">SEC 128</text>
              <text x="275" y="162" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">SEC 112</text>

              {/* Dynamic walking route path along concourse */}
              <path 
                d={activeTarget.pathD || activePathD} 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                opacity="0.3" 
              />
              <path 
                d={activeTarget.pathD || activePathD} 
                fill="none" 
                stroke="#2563eb" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <path 
                d={activeTarget.pathD || activePathD} 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="1.2" 
                strokeDasharray="4,5" 
                className="route-dash-animated" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />

              {/* Start seat position dot */}
              <circle cx={section === "104" ? 125 : 275} cy={section === "104" ? 85 : 155} r="10" fill="#3b82f6" opacity="0.3" className="animate-ping" />
              <circle cx={section === "104" ? 125 : 275} cy={section === "104" ? 85 : 155} r="5.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* Float Label overlays for Start / End */}
            <div className="absolute bottom-3 left-3 bg-slate-950/80 px-2 py-1 border border-slate-800 rounded-lg text-[9px] font-mono leading-none">
              <span className="text-slate-400 uppercase text-[7px] block">Your Seat</span>
              <span className="font-bold text-slate-200">Sec {section}</span>
            </div>

            {/* Clickable single active target pin overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div 
                style={{ 
                  left: `${(activeTarget.x / 400) * 100}%`, 
                  top: `${(activeTarget.y / 240) * 100}%`,
                  transform: 'translate(-50%, -85%)'
                }} 
                className="absolute z-20 flex flex-col items-center scale-110"
              >
                <div className="relative w-7 h-9 flex items-center justify-center shrink-0">
                  <svg 
                    style={{ color: activeTarget.color }}
                    className="absolute inset-0 w-full h-full filter drop-shadow-md" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  </svg>
                  <div className="absolute top-[5px] w-[15px] h-[15px] rounded-full bg-white flex items-center justify-center text-[9px] z-10 shadow-sm">
                    {activeEmoji}
                  </div>
                  
                  {/* Crowd capacity bubble overlay */}
                  <div className="absolute -top-3.5 px-1 rounded bg-slate-950 border border-slate-700 text-[6px] font-black text-slate-200 shadow-sm leading-tight whitespace-nowrap">
                    {activeTarget.capacity}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nearest Facility Options Horizontal Chips Selector (Phase 26 Clutter Free) */}
          <div className="space-y-1.5 shrink-0">
            <span className="text-[7.5px] text-slate-400 uppercase tracking-wider block font-black">Choose Nearest Location</span>
            <div className="flex space-x-2 overflow-x-auto scrollbar-none pb-1 py-0.5 select-none -mx-1 px-1">
              {targetsList.map((tg, idx) => {
                const isSelected = idx === selectedIndex;
                const emoji = tg.label.split(' ')[0];
                const name = tg.label.split(' ').slice(1).join(' ');
                
                return (
                  <button
                    key={tg.id}
                    onClick={() => {
                      setSelectedTargets(prev => ({
                        ...prev,
                        [msgId]: idx
                      }));
                    }}
                    className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-full border text-xs cursor-pointer transition-all duration-300 outline-none whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'border-stadium-gold bg-stadium-gold/15 text-stadium-gold shadow-[0_0_8px_rgba(251,191,36,0.06)]'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="text-[9px] font-bold">{name}</span>
                    <span 
                      style={{ color: tg.color }}
                      className="text-[8px] font-mono font-black animate-pulse"
                    >
                      ({tg.capacity}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step-by-Step Directions Guide */}
          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80 text-[10px] space-y-1.5 shrink-0 max-h-[85px] overflow-y-auto custom-scrollbar font-mono leading-normal text-slate-300">
            <span className="text-[8px] text-stadium-gold uppercase tracking-wider block font-black border-b border-slate-800 pb-1">
              🚶‍♂️ Turn-by-Turn Navigation Guide (Start: Sec {section})
            </span>
            {activeTarget.directions.map((step, sidx) => (
              <div key={sidx} className="flex items-start space-x-1.5">
                <span className="text-stadium-gold shrink-0 font-bold">{sidx + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          {/* Route info legend footer */}
          <div className="flex justify-between items-center text-[10px] font-mono bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 leading-tight">
            <div>
              <span className="text-slate-400 block uppercase text-[8px] tracking-wide font-black">Target Location</span>
              <span className="font-bold text-slate-200">{activeTarget.label}</span>
            </div>
            <div className="text-right border-l border-slate-800 pl-3 flex items-center space-x-2">
              <div>
                <span className="font-bold text-emerald-400 block">{distance} away</span>
                <span className="text-slate-400 text-[9px] block">~{eta} walk</span>
              </div>
              <button 
                onClick={toggleView}
                className="py-2.5 px-3.5 sm:py-1.5 sm:px-2.5 rounded-xl bg-stadium-gold hover:bg-stadium-gold-light text-stadium-navy-deep font-black uppercase text-[9px] cursor-pointer shadow transition-all ml-2.5 shrink-0"
              >
                Suggest Route
              </button>
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
        <div className="w-full max-w-sm bg-white border-2 border-dashed border-slate-300 text-slate-800 rounded-xl p-4 my-2 shadow-lg space-y-4 font-mono text-xs select-none">
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
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 my-2 shadow-xl space-y-4 select-none text-slate-100">
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
                      {renderMessageContent(msg.text, msg.id)}
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
