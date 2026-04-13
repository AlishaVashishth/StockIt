import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { 
  CheckCircle2, 
  Lock, 
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { api } from '../api';

export default function Home() {
  const USER_NAME_STORAGE_KEY = 'investsim_user_name';
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [indices, setIndices] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Count-up
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => 
    Math.round(latest).toLocaleString('en-IN')
  );

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [dashboardData, indicesData] = await Promise.all([
          api.getDashboard(),
          api.getMarketIndices()
        ]);
        setData(dashboardData);
        setIndices(indicesData);
        animate(count, dashboardData.portfolioSummary.totalValue, { duration: 2, ease: "easeOut" });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
    const interval = setInterval(async () => {
      try {
        const latestIndices = await api.getMarketIndices();
        setIndices(latestIndices);
      } catch (err) {
        console.error(err);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [count]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary text-accent-gold">
        <RefreshCw className="animate-spin mr-2" /> Loading Dashboard...
      </div>
    );
  }

  const { user, portfolioSummary, missions, recentActivity, dailyPnlPct, shouldTriggerLossDebrief } = data;
  const persistedName = localStorage.getItem(USER_NAME_STORAGE_KEY)?.trim();
  const displayName = persistedName || user.name;

  // For day-0 users with no holdings, keep baseline at the bottom.
  const sparkPoints = portfolioSummary.holdingsCount === 0
    ? [0, 0, 0, 0, 0, 0]
    : [portfolioSummary.totalValue * 0.8, portfolioSummary.totalValue * 0.85, portfolioSummary.totalValue * 0.9, portfolioSummary.totalValue * 0.95, portfolioSummary.totalValue * 0.98, portfolioSummary.totalValue];
  const min = Math.min(...sparkPoints);
  const max = Math.max(...sparkPoints) || 1;
  const range = (max - min) || 1;
  const width = 350;
  const height = 48;
  
  const pathData = sparkPoints.map((val, i) => {
    const x = (i / (sparkPoints.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
  const handleMissionClick = (mission: any) => {
    if (mission.completed || mission.requiredTier > user.currentTier) return;
    if (mission.missionKey === 'hold_3_days') {
      navigate('/portfolio');
      return;
    }
    navigate('/trade');
  };

  const nifty = indices?.nifty || { value: 0, changePct: 0 };
  const niftyUp = Number(nifty.changePct) >= 0;

  return (
    <div className="relative min-h-screen w-full bg-bg-primary bg-dots flex flex-col">
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border">
        <div className="h-[60px] flex items-center justify-between px-4">
          <span className="font-heading font-bold text-base">Good morning, {displayName.split(' ')[0]} 👋</span>
        </div>
        <div className="h-[30px] bg-bg-secondary border-t border-border overflow-hidden flex items-center">
          <div className="flex animate-ticker whitespace-nowrap">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center space-x-6 px-4">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono whitespace-nowrap text-text-muted">NIFTY</span>
                  <span className="text-[11px] font-mono whitespace-nowrap font-bold">{Number(nifty.value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  <span className={`text-[11px] font-mono whitespace-nowrap font-bold ${niftyUp ? 'text-accent-green' : 'text-accent-red'}`}>
                    {niftyUp ? '▲' : '▼'}{Math.abs(Number(nifty.changePct || 0)).toFixed(2)}%
                  </span>
                </div>
                <span className="text-border">|</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-[100px] pb-[80px] px-4 overflow-y-auto no-scrollbar">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemVariants} className="relative p-6 rounded-2xl bg-bg-card border border-accent-gold/30 overflow-hidden" style={{ borderImage: 'linear-gradient(to bottom right, #F0A500, transparent) 1' }}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[12px] font-mono text-text-muted uppercase tracking-wider">Total Portfolio</span>
              <div className="px-2 py-0.5 rounded bg-accent-gold/10 border border-accent-gold/20">
                <span className="text-[10px] font-bold text-accent-gold">TIER {user.currentTier} 🚀</span>
              </div>
            </div>

            <div className="flex items-baseline space-x-1 mb-1">
              <span className="text-2xl font-heading font-bold text-text-primary">₹</span>
              <motion.span className="text-[44px] font-heading font-bold text-text-primary leading-none">
                {rounded}
              </motion.span>
            </div>

            <div className="flex items-center space-x-2 mb-6">
              <span className={`text-sm font-mono font-bold ${portfolioSummary.totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {portfolioSummary.totalPnl >= 0 ? '+' : ''}₹{portfolioSummary.totalPnl} ({portfolioSummary.totalPnl >= 0 ? '+' : ''}{portfolioSummary.totalPnlPct}%) {portfolioSummary.totalPnl >= 0 ? '▲' : '▼'}
              </span>
              <span className="text-[11px] text-text-muted">All time returns</span>
            </div>

            <div className="h-[1px] bg-border mb-4" />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[18px] font-mono font-bold text-text-primary">₹{portfolioSummary.virtualCash.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-text-muted uppercase tracking-tight">Cash Available</p>
              </div>
              <div className="text-right">
                <p className="text-[18px] font-mono font-bold text-text-primary">{user.daysActive || 0} Days</p>
                <p className="text-[11px] text-text-muted uppercase tracking-tight">Active Streak 🔥</p>
              </div>
            </div>

            <div className="relative h-12 w-full mt-2">
              <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <motion.path
                  d={pathData}
                  fill="none"
                  stroke={portfolioSummary.totalPnl >= 0 ? "#00D4A1" : "#FF4757"}
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </svg>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
            <div className="bg-bg-card border border-border p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-text-muted uppercase block mb-1">📈 Best</span>
              {portfolioSummary.bestPerformer ? (
                <>
                  <p className="text-[11px] font-mono font-bold text-text-primary truncate">{portfolioSummary.bestPerformer.symbol}</p>
                  <p className="text-xs font-mono font-bold text-accent-green">+{portfolioSummary.bestPerformer.pnlPct}%</p>
                </>
              ) : (
                <p className="text-xs font-mono text-text-muted mt-2">N/A</p>
              )}
            </div>
            <div className="bg-bg-card border border-border p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-text-muted uppercase block mb-1">Watch</span>
              {portfolioSummary.worstPerformer ? (
                <>
                  <p className="text-[11px] font-mono font-bold text-text-primary truncate">{portfolioSummary.worstPerformer.symbol}</p>
                  <p className="text-xs font-mono font-bold text-accent-red">{portfolioSummary.worstPerformer.pnlPct}%</p>
                </>
              ) : (
                <p className="text-xs font-mono text-text-muted mt-2">N/A</p>
              )}
            </div>
            <div className="bg-bg-card border border-border p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-text-muted uppercase block mb-1">🛡️ Risk</span>
              <p className="text-[12px] font-heading font-bold text-accent-gold">{portfolioSummary.diversityScore}/10</p>
              <p className="text-[10px] text-text-muted truncate">Diversity</p>
            </div>
          </motion.div>

          {shouldTriggerLossDebrief && (
            <motion.div 
              variants={itemVariants}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/loss-debrief')}
              className="flex items-center p-4 rounded-xl bg-accent-red/10 border border-accent-red animate-pulse-red cursor-pointer"
            >
              <span className="text-3xl mr-4">💥</span>
              <div className="flex-1">
                <h3 className="text-sm font-heading font-bold text-accent-red">Portfolio Alert</h3>
                <p className="text-[12px] text-text-primary leading-tight">Your portfolio dropped {dailyPnlPct}% today. Tap to analyze.</p>
              </div>
              <ChevronRight size={20} className="text-accent-red" />
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-lg font-heading font-bold text-text-primary">🎯 Missions</h2>
                <div className="w-48 h-1.5 bg-bg-secondary rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (user.xpPoints / 500) * 100)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-accent-gold"
                  />
                </div>
              </div>
              <button onClick={() => navigate('/profile')} className="text-xs font-bold text-accent-gold uppercase tracking-wider">
                {user.xpPoints} XP →
              </button>
            </div>

            <div className="space-y-3">
              {missions.map((m: any, i: number) => {
                const isComplete = m.completed;
                const isLocked = m.requiredTier > user.currentTier;
                return (
                  <button
                    key={i}
                    onClick={() => handleMissionClick(m)}
                    className={`w-full flex items-center p-4 rounded-xl border border-border text-left ${isComplete ? 'bg-bg-card opacity-80' : isLocked ? 'bg-bg-card opacity-50 cursor-not-allowed' : 'bg-bg-card cursor-pointer'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${isComplete ? 'bg-accent-green/20' : isLocked ? 'bg-border' : 'bg-accent-gold/20'}`}>
                      {isComplete ? <CheckCircle2 size={18} className="text-accent-green" /> : isLocked ? <Lock size={18} className="text-text-muted" /> : <RefreshCw size={18} className="text-accent-gold animate-spin-slow" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm text-text-primary ${isComplete ? 'line-through decoration-text-muted' : ''}`}>{m.title}</p>
                      {!isComplete && !isLocked && <p className="text-[10px] text-accent-gold mt-1">Tap to work on this mission</p>}
                      {!isComplete && typeof m.progress === 'number' && typeof m.total === 'number' && (
                        <p className="text-[10px] text-text-muted">{m.progress}/{m.total} complete</p>
                      )}
                      {isLocked && <p className="text-[10px] text-text-muted">Unlock at Tier {m.requiredTier}</p>}
                    </div>
                    <div className={`px-2 py-0.5 rounded border ${isComplete ? 'bg-accent-green/10 border-accent-green/20 text-accent-green' : isLocked ? 'bg-bg-secondary border-border text-text-muted' : 'bg-accent-gold/10 border-accent-gold/20 text-accent-gold'}`}>
                      <span className="text-[10px] font-bold">+{m.xpReward} XP</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4 pb-4">
            <h2 className="text-lg font-heading font-bold text-text-primary">Recent Activity</h2>
            <div className="relative pl-6 space-y-6">
              <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-accent-gold/30" />
              {recentActivity.length === 0 ? (
                <p className="text-xs text-text-muted">No activity yet. Start trading or learning!</p>
              ) : (
                recentActivity.map((act: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-bg-primary ${act.type === 'TRADE' ? 'bg-accent-green' : 'bg-accent-gold'}`} />
                    <p className="text-[13px] font-mono text-text-primary">{act.description}</p>
                    <p className="text-[11px] text-text-muted">{new Date(act.timestamp).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
