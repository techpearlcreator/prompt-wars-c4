import React, { useState, useEffect, useRef } from 'react';
import ChatWindow from '../components/ChatWindow';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import translations from '../i18n';
import { fetchConcessionsQueue } from '../services/api';
import { Trophy, MapPin, Users, Flame, Info, BarChart2, Globe, Calendar, BellRing, Clock, Heart } from 'lucide-react';
import { io } from 'socket.io-client';

export default function App() {
  const [matchId, setMatchId] = useState('fifa_2026_001');
  const [language, setLanguage] = useState('English');
  const [showDashboard, setShowDashboard] = useState(false);

  // Live WebSocket overrides
  const [liveScore, setLiveScore] = useState(null);
  const [liveMinute, setLiveMinute] = useState(null);
  const [customEvents, setCustomEvents] = useState([]);
  const [toast, setToast] = useState(null);

  // Cheer Meter State
  const [cheers, setCheers] = useState({ homePercent: 50, awayPercent: 50 });
  const [isCheering, setIsCheering] = useState(null); // Animation state

  // Concessions Queue status
  const [concessions, setConcessions] = useState([]);

  const socketRef = useRef(null);
  const t = translations[language] || translations['English'];
  const isArgMatch = matchId === 'fifa_2026_001';

  // 1. Establish WebSocket Connection & Room Joiner
  useEffect(() => {
    setLiveScore(null);
    setLiveMinute(null);
    setCustomEvents([]);
    setToast(null);
    setCheers({ homePercent: 50, awayPercent: 50 });

    const socket = io('/', {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to WebSocket server:', socket.id);
      socket.emit('join_match', matchId);
    });

    // Handle cheer updates
    socket.on('cheer_update', (data) => {
      setCheers(data);
    });

    socket.on('match_event', (event) => {
      console.log('Live Match Event Received:', event);
      setLiveScore(event.liveScore);
      setLiveMinute(event.liveMinute);
      setCustomEvents((prev) => [event, ...prev]);
      setToast(event);

      const timer = setTimeout(() => {
        setToast(null);
      }, 6000);

      return () => clearTimeout(timer);
    });

    return () => {
      socket.disconnect();
    };
  }, [matchId]);

  // 2. Fetch Concessions Queue
  useEffect(() => {
    const loadConcessions = async () => {
      try {
        const data = await fetchConcessionsQueue(matchId);
        setConcessions(data.concessions || []);
      } catch (err) {
        console.warn("Failed to load concessions database.");
      }
    };
    loadConcessions();
  }, [matchId]);

  // 3. Emit cheer
  const submitCheer = (team) => {
    if (socketRef.current) {
      socketRef.current.emit('submit_cheer', { matchId, team });
      setIsCheering(team);
      setTimeout(() => setIsCheering(null), 800);
    }
  };

  return (
    <main 
      id="app-main-layout"
      className="flex flex-col h-screen bg-stadium-navy-deep text-slate-100 font-sans overflow-hidden relative"
    >
      {/* Premium ambient glow */}
      <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] rounded-full bg-stadium-gold/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none"></div>

      {/* Floating Real-Time WebSocket Toast Notification */}
      {toast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm sm:max-w-md px-4 animate-in slide-in-from-top-12 duration-300">
          <div className="bg-stadium-navy-card border border-stadium-gold/80 rounded-2xl p-4 shadow-2xl flex items-start space-x-3.5 bg-gradient-to-r from-stadium-navy-card to-stadium-navy-bubble">
            <div className="w-9 h-9 rounded-full bg-stadium-gold/10 flex items-center justify-center border border-stadium-gold shrink-0 animate-bounce">
              <BellRing className="w-4 h-4 text-stadium-gold-light" />
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="flex justify-between items-center">
                <span className="px-2 py-0.5 rounded bg-stadium-gold text-stadium-navy-deep text-[9px] font-black uppercase tracking-wider">
                  Live: {toast.type}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">Min {toast.minute}'</span>
              </div>
              <p className="text-sm font-bold text-slate-100">
                {toast.player ? `${toast.player}!` : 'Match Update'}
              </p>
              <p className="text-xs text-slate-300 leading-normal">{toast.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-stadium-navy-light/40 bg-stadium-navy-deep/80 backdrop-blur-md z-10 shrink-0 gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-lg bg-stadium-gold flex items-center justify-center shadow-lg">
            <Trophy className="w-5 h-5 text-stadium-navy-deep" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-slate-100 flex items-center">
              FIFA WORLD CUP <span className="text-stadium-gold ml-1.5">2026</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">{t.subtitle}</p>
          </div>
        </div>
        
        {/* Controls: Match, Language, Dashboard */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
          {/* Match Dropdown */}
          <div className="flex items-center space-x-1.5 bg-stadium-navy-card border border-stadium-navy-light px-2.5 py-1.5 rounded-xl text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-stadium-gold" />
            <select 
              value={matchId} 
              onChange={(e) => setMatchId(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-200 cursor-pointer font-medium"
              aria-label={t.selectMatch}
            >
              <option value="fifa_2026_001" className="bg-stadium-navy-card">ARG vs AUS</option>
              <option value="fifa_2026_002" className="bg-stadium-navy-card">FRA vs MAR</option>
            </select>
          </div>

          {/* Language Dropdown */}
          <div className="flex items-center space-x-1.5 bg-stadium-navy-card border border-stadium-navy-light px-2.5 py-1.5 rounded-xl text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-stadium-gold" />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-200 cursor-pointer font-medium"
              aria-label={t.selectLanguage}
            >
              <option value="English" className="bg-stadium-navy-card">English</option>
              <option value="Spanish" className="bg-stadium-navy-card">Español</option>
              <option value="Hindi" className="bg-stadium-navy-card">हिन्दी</option>
              <option value="Arabic" className="bg-stadium-navy-card">العربية</option>
              <option value="Mandarin" className="bg-stadium-navy-card">简体中文</option>
            </select>
          </div>

          {/* Dashboard Toggle Button */}
          <button
            onClick={() => setShowDashboard(true)}
            className="flex items-center space-x-1.5 bg-stadium-gold hover:bg-stadium-gold-light text-stadium-navy-deep px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{t.openDashboard}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4 z-10">
        
        {/* Desktop Side Stats Panel */}
        <section 
          aria-label="Live Match Status" 
          className="hidden md:flex flex-col w-80 shrink-0 bg-stadium-navy-card rounded-3xl border border-stadium-navy-light/60 p-5 space-y-4 overflow-y-auto custom-scrollbar"
        >
          {/* Header */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-stadium-gold">Live Match Board</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isArgMatch ? 'MetLife Stadium • East Rutherford' : 'SoFi Stadium • Inglewood'}
            </p>
          </div>

          {/* Match Score Card */}
          <div className="bg-stadium-navy-deep border border-stadium-navy-light/80 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner shrink-0">
            <div className="flex items-center justify-between w-full text-xs font-bold text-slate-400 px-2 mb-2">
              <span>{isArgMatch ? 'ARG' : 'FRA'}</span>
              <span className="px-2 py-0.5 rounded bg-stadium-gold/10 text-stadium-gold animate-pulse text-[10px]">
                MIN {liveMinute || (isArgMatch ? "67'" : "43'")}
              </span>
              <span>{isArgMatch ? 'AUS' : 'MAR'}</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <span className="text-3xl font-extrabold text-slate-100">
                {liveScore ? liveScore.home : (isArgMatch ? '2' : '1')}
              </span>
              <span className="text-slate-500 font-medium">:</span>
              <span className="text-3xl font-extrabold text-slate-100">
                {liveScore ? liveScore.away : (isArgMatch ? '1' : '0')}
              </span>
            </div>
            
            <div className="flex justify-between w-full text-[10px] text-slate-400 mt-3 border-t border-stadium-navy-light/40 pt-2 px-1">
              <span>{isArgMatch ? 'Argentina' : 'France'}</span>
              <span>{isArgMatch ? 'Australia' : 'Morocco'}</span>
            </div>
          </div>

          {/* Live Cheer Meter (Phase 9 Widget) */}
          <div className="space-y-2.5 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center"><Heart className="w-3.5 h-3.5 text-stadium-gold mr-1.5" /> Cheer Meter</span>
              <span className="text-[10px] text-slate-500">Live Crowd Sentiment</span>
            </h3>
            
            <div className="bg-stadium-navy-deep/45 border border-stadium-navy-light/40 rounded-2xl p-3.5 space-y-3.5 shadow-md">
              {/* Cheer Percent Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-300 px-0.5">
                  <span>{isArgMatch ? 'ARG' : 'FRA'} {cheers.homePercent}%</span>
                  <span>{isArgMatch ? 'AUS' : 'MAR'} {cheers.awayPercent}%</span>
                </div>
                <div className="h-2.5 w-full bg-stadium-navy-bubble rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${cheers.homePercent}%` }} 
                    className="h-full bg-stadium-gold transition-all duration-500 ease-out"
                  ></div>
                  <div 
                    style={{ width: `${cheers.awayPercent}%` }} 
                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                  ></div>
                </div>
              </div>

              {/* Tap to Cheer Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => submitCheer('home')}
                  className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center space-x-1 transition-all ${
                    isCheering === 'home' 
                      ? 'bg-stadium-gold border-stadium-gold text-stadium-navy-deep scale-95' 
                      : 'border-stadium-gold/40 hover:border-stadium-gold text-stadium-gold bg-stadium-gold/5'
                  } cursor-pointer`}
                >
                  <span>🎺</span>
                  <span>Cheer {isArgMatch ? 'ARG' : 'FRA'}</span>
                </button>
                <button
                  onClick={() => submitCheer('away')}
                  className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center space-x-1 transition-all ${
                    isCheering === 'away' 
                      ? 'bg-blue-500 border-blue-500 text-slate-100 scale-95' 
                      : 'border-blue-500/40 hover:border-blue-500 text-blue-400 bg-blue-500/5'
                  } cursor-pointer`}
                >
                  <span>🎺</span>
                  <span>Cheer {isArgMatch ? 'AUS' : 'MAR'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Queue Board (Phase 8 Widget) */}
          <div className="space-y-2.5 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
              <Clock className="w-3.5 h-3.5 text-stadium-gold mr-1.5" /> Live Queue Board
            </h3>
            
            <div className="bg-stadium-navy-deep/45 border border-stadium-navy-light/40 rounded-2xl p-3.5 space-y-2.5 shadow-md">
              {concessions.map((item) => {
                const isBusy = item.status === 'busy';
                const isMod = item.status === 'moderate';
                
                return (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium truncate max-w-[170px]" title={item.name}>
                      {item.name}
                    </span>
                    <span className="flex items-center space-x-1.5 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${
                        isBusy ? 'bg-red-500' : isMod ? 'bg-amber-500' : 'bg-green-500'
                      }`}></span>
                      <span className={`font-bold ${
                        isBusy ? 'text-red-400' : isMod ? 'text-amber-400' : 'text-green-400'
                      }`}>
                        {item.waitTime}m
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event Feed */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
              <Flame className="w-3.5 h-3.5 text-stadium-gold mr-1.5" /> Recent Events
            </h3>
            
            <div className="space-y-3 border-l border-stadium-navy-light/60 ml-2 pl-3 py-1">
              {customEvents.map((evt, index) => (
                <div key={`custom-${index}`} className="relative text-xs animate-in slide-in-from-left duration-300">
                  <span className="absolute left-[-17px] top-1.5 w-2.5 h-2.5 rounded-full bg-stadium-gold ring-4 ring-stadium-navy-card"></span>
                  <p className="text-[10px] text-stadium-gold font-bold">Minute {evt.minute}</p>
                  <p className="text-slate-200 font-medium">LIVE: {evt.type}</p>
                  <p className="text-[11px] text-slate-300">{evt.description}</p>
                </div>
              ))}

              {isArgMatch ? (
                <>
                  <div className="relative text-xs">
                    <span className="absolute left-[-17px] top-1.5 w-2 h-2 rounded-full bg-stadium-gold ring-4 ring-stadium-navy-card"></span>
                    <p className="text-[10px] text-slate-400">Minute 61</p>
                    <p className="text-slate-200 font-medium">Goal Australia!</p>
                    <p className="text-[11px] text-slate-400">Duke (Header)</p>
                  </div>
                  <div className="relative text-xs">
                    <span className="absolute left-[-17px] top-1.5 w-2 h-2 rounded-full bg-stadium-navy-light ring-4 ring-stadium-navy-card"></span>
                    <p className="text-[10px] text-slate-400">Minute 55</p>
                    <p className="text-slate-200 font-medium">Sub Australia</p>
                    <p className="text-[11px] text-slate-400">Irvine in / Leckie out</p>
                  </div>
                  <div className="relative text-xs">
                    <span className="absolute left-[-17px] top-1.5 w-2 h-2 rounded-full bg-stadium-gold ring-4 ring-stadium-navy-card"></span>
                    <p className="text-[10px] text-slate-400">Minute 34</p>
                    <p className="text-slate-200 font-medium">Goal Confirmed (VAR)</p>
                    <p className="text-[11px] text-slate-400">Alvarez score check</p>
                  </div>
                  <div className="relative text-xs">
                    <span className="absolute left-[-17px] top-1.5 w-2 h-2 rounded-full bg-stadium-gold ring-4 ring-stadium-navy-card"></span>
                    <p className="text-[10px] text-slate-400">Minute 12</p>
                    <p className="text-slate-200 font-medium">Goal Argentina!</p>
                    <p className="text-[11px] text-slate-400">Messi (Long strike)</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative text-xs">
                    <span className="absolute left-[-17px] top-1.5 w-2 h-2 rounded-full bg-stadium-navy-light ring-4 ring-stadium-navy-card"></span>
                    <p className="text-[10px] text-slate-400">Minute 38</p>
                    <p className="text-slate-200 font-medium">VAR check: No Penalty</p>
                    <p className="text-[11px] text-slate-400">Accidental handball ruled</p>
                  </div>
                  <div className="relative text-xs">
                    <span className="absolute left-[-17px] top-1.5 w-2 h-2 rounded-full bg-stadium-navy-light ring-4 ring-stadium-navy-card"></span>
                    <p className="text-[10px] text-slate-400">Minute 21</p>
                    <p className="text-slate-200 font-medium">Yellow Card Morocco</p>
                    <p className="text-[11px] text-slate-400">Amrabat (Tactical foul)</p>
                  </div>
                  <div className="relative text-xs">
                    <span className="absolute left-[-17px] top-1.5 w-2 h-2 rounded-full bg-stadium-gold ring-4 ring-stadium-navy-card"></span>
                    <p className="text-[10px] text-slate-400">Minute 5</p>
                    <p className="text-slate-200 font-medium">Goal France!</p>
                    <p className="text-[11px] text-slate-400">Mbappe (Rebound strike)</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-stadium-navy-light/30 border border-stadium-navy-light/50 rounded-2xl p-4 space-y-2.5 text-xs text-slate-400 mt-auto">
            <div className="flex items-center space-x-2 text-stadium-gold-soft font-semibold">
              <Info className="w-4 h-4 shrink-0" />
              <span>Operations Info</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> Venue</span>
                <span className="text-slate-200 font-medium">{isArgMatch ? 'MetLife Stadium' : 'SoFi Stadium'}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> Crowd</span>
                <span className="text-slate-200 font-medium">{isArgMatch ? '82,500 Fans' : '70,240 Fans'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Chat window space */}
        <div className="flex-1 h-full overflow-hidden">
          <ChatWindow 
            matchId={matchId} 
            language={language} 
            t={t} 
            socket={socketRef.current} 
          />
        </div>
      </div>

      {/* Analytics Dashboard modal */}
      {showDashboard && (
        <AnalyticsDashboard onClose={() => setShowDashboard(false)} t={t} />
      )}
    </main>
  );
}
