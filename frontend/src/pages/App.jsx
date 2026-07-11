import React from 'react';
import ChatWindow from '../components/ChatWindow';
import { Trophy, MapPin, Users, Flame, Info } from 'lucide-react';

export default function App() {
  return (
    <main 
      id="app-main-layout"
      className="flex flex-col h-screen bg-stadium-navy-deep text-slate-100 font-sans overflow-hidden relative"
    >
      {/* Premium ambient glow */}
      <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] rounded-full bg-stadium-gold/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-stadium-navy-light/40 bg-stadium-navy-deep/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-stadium-gold flex items-center justify-center shadow-lg">
            <Trophy className="w-5 h-5 text-stadium-navy-deep" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-wide uppercase text-slate-100 flex items-center">
              FIFA WORLD CUP <span className="text-stadium-gold ml-1.5">2026</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Stadium Operations Intelligence</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center space-x-3 text-xs bg-stadium-navy-card/80 border border-stadium-navy-light px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-slate-300 font-semibold select-none">Live Ops Portal</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4 z-10">
        
        {/* Desktop Side Stats Panel */}
        <section 
          aria-label="Live Match Status" 
          className="hidden md:flex flex-col w-80 shrink-0 bg-stadium-navy-card rounded-3xl border border-stadium-navy-light/60 p-5 space-y-6 overflow-y-auto custom-scrollbar"
        >
          {/* Header */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-stadium-gold">Live Match Board</h2>
            <p className="text-xs text-slate-400 mt-0.5">MetLife Stadium • East Rutherford</p>
          </div>

          {/* Match Score Card */}
          <div className="bg-stadium-navy-deep border border-stadium-navy-light/80 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            <div className="flex items-center justify-between w-full text-xs font-bold text-slate-400 px-2 mb-2">
              <span>ARG</span>
              <span className="px-2 py-0.5 rounded bg-stadium-gold/10 text-stadium-gold animate-pulse text-[10px]">MIN 67'</span>
              <span>AUS</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <span className="text-3xl font-extrabold text-slate-100">2</span>
              <span className="text-slate-500 font-medium">:</span>
              <span className="text-3xl font-extrabold text-slate-100">1</span>
            </div>
            
            <div className="flex justify-between w-full text-[10px] text-slate-400 mt-3 border-t border-stadium-navy-light/40 pt-2 px-1">
              <span>Argentina</span>
              <span>Australia</span>
            </div>
          </div>

          {/* Event Feed */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
              <Flame className="w-3.5 h-3.5 text-stadium-gold mr-1.5" /> Recent Events
            </h3>
            
            <div className="space-y-3 border-l border-stadium-navy-light/60 ml-2 pl-3 py-1">
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
                <span className="text-slate-200 font-medium">MetLife Stadium</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> Crowd</span>
                <span className="text-slate-200 font-medium">82,500 Fans</span>
              </div>
            </div>
          </div>
        </section>

        {/* Chat window space */}
        <div className="flex-1 h-full overflow-hidden">
          <ChatWindow />
        </div>
      </div>
    </main>
  );
}
