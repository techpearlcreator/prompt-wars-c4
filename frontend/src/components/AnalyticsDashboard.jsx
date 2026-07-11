import React, { useEffect, useState } from 'react';
import { fetchAnalytics } from '../services/api';
import { X, RefreshCw, BarChart2, Shield, HeartHandshake, Zap } from 'lucide-react';

export default function AnalyticsDashboard({ onClose, t }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await fetchAnalytics();
      setData(stats);
    } catch (err) {
      setError("Failed to load statistics database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!t) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stadium-navy-deep/80 backdrop-blur-md flex items-center justify-center p-4">
      {/* Dashboard panel */}
      <section 
        id="analytics-dashboard"
        aria-label={t.dashboardTitle}
        className="w-full max-w-xl bg-stadium-navy-card rounded-3xl border border-stadium-navy-light shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 bg-stadium-navy-bubble border-b border-stadium-navy-light/60">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-stadium-gold" />
            <h2 className="text-sm md:text-base font-bold text-slate-100">{t.dashboardTitle}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={loadData}
              title="Refresh Data"
              className="p-1.5 rounded-lg hover:bg-stadium-navy-light text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stadium-navy-light text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 rounded-full border-4 border-stadium-navy-light border-t-stadium-gold animate-spin"></div>
              <span className="text-xs text-slate-400">Compiling database...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400 text-xs">
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Stat grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-stadium-navy-deep border border-stadium-navy-light/50 p-4 rounded-2xl text-center space-y-1">
                  <Shield className="w-5 h-5 text-stadium-gold mx-auto opacity-80" />
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{t.totalQuestions}</p>
                  <p className="text-xl font-black text-slate-100">{data.totalQuestions}</p>
                </div>
                
                <div className="bg-stadium-navy-deep border border-stadium-navy-light/50 p-4 rounded-2xl text-center space-y-1">
                  <Zap className="w-5 h-5 text-stadium-gold mx-auto opacity-80" />
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{t.avgLatency}</p>
                  <p className="text-xl font-black text-slate-100">{data.avgResponseTime}</p>
                </div>
                
                <div className="bg-stadium-navy-deep border border-stadium-navy-light/50 p-4 rounded-2xl text-center space-y-1">
                  <HeartHandshake className="w-5 h-5 text-stadium-gold mx-auto opacity-80" />
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{t.satisfaction}</p>
                  <p className="text-xl font-black text-stadium-gold-light">{data.userSatisfaction}%</p>
                </div>
              </div>

              {/* Progress bars for topics */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.popularTopics}</h3>
                <div className="space-y-3 bg-stadium-navy-deep/40 border border-stadium-navy-light/40 p-4 rounded-2xl">
                  {Object.entries(data.topicsAsked).map(([topic, count]) => {
                    const percent = data.totalQuestions > 0 ? Math.round((count / data.totalQuestions) * 100) : 0;
                    return (
                      <div key={topic} className="space-y-1 text-xs">
                        <div className="flex justify-between font-medium text-slate-300">
                          <span>{topic}</span>
                          <span className="text-slate-400">{count} ({percent}%)</span>
                        </div>
                        <div className="w-full h-2 bg-stadium-navy-deep rounded-full overflow-hidden border border-stadium-navy-light/30">
                          <div 
                            className="h-full bg-stadium-gold rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 bg-stadium-navy-bubble border-t border-stadium-navy-light/60 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stadium-navy-light hover:bg-stadium-navy-accent text-slate-200 text-xs font-bold transition-all cursor-pointer border border-stadium-navy-light"
          >
            {t.closeBtn}
          </button>
        </footer>
      </section>
    </div>
  );
}
