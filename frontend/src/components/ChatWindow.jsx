import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import InputBox from './InputBox';
import { sendChatMessage, fetchChatHistory, submitIncidentReport } from '../services/api';
import { RefreshCw, AlertCircle, AlertTriangle, X } from 'lucide-react';

/**
 * ChatWindow Component
 * Manages chat flow, state, errors, and live poll socket listeners.
 * Integrates an SOS Emergency reporting modal.
 */
export default function ChatWindow({ matchId, language, t, socket }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState('anonymous');

  // Emergency Modal State
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosType, setSosType] = useState('medical');
  const [sosSection, setSosSection] = useState('');
  const [sosDetails, setSosDetails] = useState('');
  const [isSubmittingSos, setIsSubmittingSos] = useState(false);

  // 1. Generate / Retrieve UserId on mount & load history
  useEffect(() => {
    let localId = localStorage.getItem('fifa_user_id');
    if (!localId) {
      localId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('fifa_user_id', localId);
    }
    setUserId(localId);
    loadHistory(localId);
  }, []);

  // 2. Listen for Live WebSocket Polls
  useEffect(() => {
    if (!socket) return;

    const handleMatchPoll = (pollData) => {
      console.log("Interactive poll pushed:", pollData);
      const pollMsg = {
        id: pollData.id,
        sender: 'ai',
        text: `📊 LIVE FAN POLL:\n${pollData.question}`,
        timestamp: new Date().toISOString(),
        isPoll: true,
        options: pollData.options
      };
      setMessages((prev) => [...prev, pollMsg]);
    };

    socket.on('match_poll', handleMatchPoll);

    return () => {
      socket.off('match_poll', handleMatchPoll);
    };
  }, [socket]);

  const loadHistory = async (id) => {
    try {
      const data = await fetchChatHistory(id);
      if (data.history && data.history.length > 0) {
        setMessages(data.history);
      }
    } catch (err) {
      console.warn("Could not retrieve past chat history logs.");
    }
  };

  const handleSendMessage = async (text) => {
    setError(null);
    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const data = await sendChatMessage(text, userId, matchId, language);
      const aiMsg = {
        id: data.id || `ai_${Date.now()}`,
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

  const handleClearChat = async () => {
    setMessages([]);
    setError(null);
    setIsTyping(false);
    
    try {
      await fetch(`/api/chat/history/${userId}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  };

  // Submit emergency SOS dispatch form
  const handleSosSubmit = async (e) => {
    e.preventDefault();
    if (!sosDetails.trim()) return;

    setIsSubmittingSos(true);
    setError(null);

    const reportObj = {
      matchId,
      type: sosType,
      section: sosSection || "Unknown",
      details: sosDetails
    };

    try {
      // 1. Submit SOS report to backend
      const result = await submitIncidentReport(reportObj);
      
      if (result.success) {
        // 2. Append User message showing SOS report details in chat thread
        const sosUserMsg = {
          id: `usr_${Date.now()}`,
          sender: 'user',
          text: `⚠️ SOS EMERGENCY REPORT: ${sosType.toUpperCase()} Incident in Section ${sosSection || 'Unknown'} - ${sosDetails}`,
          timestamp: new Date().toISOString()
        };

        // 3. Append AI Emergency responder message
        const isArg = matchId === 'fifa_2026_001';
        const firstAidSecs = isArg ? "Section 103 or 128" : "Section 120 or 220";
        const sosAiResponse = `🚨 DISPATCH CONFIRMED: A dispatch report (${result.incident.id}) has been issued to stadium stewards. Paramedics and stewards are heading to Section ${sosSection || 'Unknown'} immediately. If you can walk safely, the closest first aid booth is located near ${firstAidSecs}. Please stay calm.`;

        const sosAiMsg = {
          id: result.incident.id,
          sender: 'ai',
          text: sosAiResponse,
          timestamp: new Date().toISOString()
        };

        setMessages((prev) => [...prev, sosUserMsg, sosAiMsg]);
        setShowSosModal(false);
        
        // Clear input states
        setSosSection('');
        setSosDetails('');
      }
    } catch (err) {
      setError("Failed to log emergency report. Please find a stadium steward immediately!");
    } finally {
      setIsSubmittingSos(false);
    }
  };

  return (
    <section 
      id="chat-window"
      aria-label="FIFA Chat Assistant" 
      className="flex flex-col h-full bg-stadium-navy-card rounded-3xl border border-stadium-navy-light/60 overflow-hidden shadow-2xl animate-fade-in relative"
    >
      {/* SOS Report Dialog Overlay Modal */}
      {showSosModal && (
        <div className="absolute inset-0 bg-stadium-navy-deep/85 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSosSubmit}
            className="w-full max-w-sm bg-stadium-navy-card border border-red-500/40 rounded-2xl p-5 space-y-4 shadow-2xl animate-in zoom-in duration-200"
          >
            <div className="flex justify-between items-center pb-2 border-b border-stadium-navy-light/60">
              <div className="flex items-center space-x-2 text-red-400 font-extrabold text-sm uppercase">
                <AlertTriangle className="w-5 h-5 animate-pulse text-red-500" />
                <span>Submit SOS Alert</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowSosModal(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Incident Type</label>
              <select
                value={sosType}
                onChange={(e) => setSosType(e.target.value)}
                className="w-full bg-stadium-navy-deep border border-stadium-navy-light/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-red-500/80 outline-none"
              >
                <option value="medical">Medical Emergency</option>
                <option value="security">Security / Fight / Conflict</option>
                <option value="hazard">Facility Hazard (Spill/Fire)</option>
                <option value="lost_person">Lost / Missing Person</option>
              </select>
            </div>

            {/* Section number */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Seating Section</label>
              <input
                type="text"
                placeholder="e.g. 112"
                value={sosSection}
                onChange={(e) => setSosSection(e.target.value)}
                className="w-full bg-stadium-navy-deep border border-stadium-navy-light/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-red-500/80 outline-none"
              />
            </div>

            {/* details */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Emergency Details</label>
              <textarea
                placeholder="Describe what is happening..."
                value={sosDetails}
                onChange={(e) => setSosDetails(e.target.value)}
                rows={3}
                required
                className="w-full bg-stadium-navy-deep border border-stadium-navy-light/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-red-500/80 outline-none resize-none"
              />
            </div>

            <div className="flex space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSosModal(false)}
                className="flex-1 py-2 rounded-xl bg-stadium-navy-light hover:bg-stadium-navy-accent text-xs font-bold transition-all text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingSos}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold transition-all text-slate-100 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmittingSos ? "Filing..." : "Send SOS Dispatch"}
              </button>
            </div>
          </form>
        </div>
      )}

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
            <h1 className="text-sm md:text-base font-bold text-slate-100">{t.title}</h1>
            <p className="text-[11px] text-slate-400">
              {matchId === 'fifa_2026_001' ? 'Argentina vs Australia • Min 67' : 'France vs Morocco • Min 43'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* SOS button */}
          <button
            onClick={() => setShowSosModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-slate-100 text-xs font-black tracking-wide cursor-pointer transition-all animate-pulse"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SOS</span>
          </button>

          <button 
            onClick={handleClearChat}
            title={t.clearTitle}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-stadium-navy-light hover:bg-stadium-navy-accent text-slate-400 hover:text-stadium-gold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Message space */}
      <MessageList 
        messages={messages} 
        isTyping={isTyping} 
        ratingThanksText={t.ratingThanks}
      />

      {/* Error alert */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center space-x-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Chat input */}
      <footer className="p-4 bg-stadium-navy-bubble border-t border-stadium-navy-light/60">
        <InputBox 
          onSendMessage={handleSendMessage} 
          disabled={isTyping} 
          disabledPlaceholder={t.disabledPlaceholder}
          placeholder={t.placeholder}
        />
      </footer>
    </section>
  );
}
