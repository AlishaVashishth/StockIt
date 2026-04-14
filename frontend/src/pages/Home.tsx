import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { 
  CheckCircle2, 
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { api } from '../api';
import { courseData } from '../data/courseData';
import { getCompletedItems, getNextIncompleteItem } from '../utils/progressUtils';
import CongratsModal from '../components/CongratsModal';
import { missionsData } from '../data/missionsData';
import {
  checkAndAdvanceBatch,
  completeMission,
  getActiveMissions,
  getCompletedMissions,
  getMissionProgress,
  isMissionComplete,
} from '../utils/missionUtils';
import { addXP, getCurrentLevel, getTotalXP, getXPProgress } from '../utils/xpUtils';
import { addRecentActivity, removeRecentActivityByText } from '../utils/activityUtils';
import MissionConfirmModal from '../components/MissionConfirmModal';
import UndoSnackbar from '../components/UndoSnackbar';

export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [indices, setIndices] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cachedProfile, setCachedProfile] = useState<any>(null);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [showCongrats, setShowCongrats] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [missionDone, setMissionDone] = useState<string[]>([]);
  const [missionProgressMap, setMissionProgressMap] = useState<Record<string, { current: number; target: number }>>({});
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [recentActivityLog, setRecentActivityLog] = useState<Array<{ text: string; date: string }>>([]);
  const [xpMessage, setXpMessage] = useState<string | null>(null);
  const [newMissionBanner, setNewMissionBanner] = useState(false);
  const [confirmMission, setConfirmMission] = useState<any | null>(null);
  const [undoState, setUndoState] = useState<{ open: boolean; missionId?: string; xp?: number; title?: string; timeoutAt?: number }>({ open: false });
  const USER_PROFILE_CACHE_KEY = 'stockit_user_profile_cache';
  const MANDATORY_FALLBACKS = {
    nifty: { name: 'NIFTY 50', value: null, change: null, changePct: null },
    sensex: { name: 'SENSEX', value: null, change: null, changePct: null },
    gold: { name: 'Gold (XAU/USD)', value: null, change: null, changePct: null },
    silver: { name: 'Silver (XAG/USD)', value: null, change: null, changePct: null }
  };
  
  // Count-up
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => 
    Math.round(latest).toLocaleString('en-IN')
  );

  useEffect(() => {
    try {
      const cachedProfileRaw = localStorage.getItem(USER_PROFILE_CACHE_KEY);
      if (cachedProfileRaw) {
        setCachedProfile(JSON.parse(cachedProfileRaw));
      }
    } catch (err) {
      console.error(err);
    }

    // Show the latest known indices immediately while fresh data loads.
    try {
      const cachedIndices = localStorage.getItem('stockit_cached_indices');
      if (cachedIndices) {
        setIndices(JSON.parse(cachedIndices));
      }
    } catch (err) {
      console.error(err);
    }

    const refreshIndices = async () => {
      try {
        const latestIndices = await api.getMarketIndices();
        setIndices((prev: any) => {
          const merged = {
            ...prev,
            ...latestIndices,
            // Keep last good core indices if API returns null/empty during a refresh.
            nifty: latestIndices?.nifty || prev?.nifty || null,
            sensex: latestIndices?.sensex || prev?.sensex || null,
            // Keep previous global list when transient response misses it.
            global:
              Array.isArray(latestIndices?.global) && latestIndices.global.length > 0
                ? latestIndices.global
                : Array.isArray(prev?.global)
                ? prev.global
                : []
          };
          localStorage.setItem('stockit_cached_indices', JSON.stringify(merged));
          return merged;
        });
      } catch (err) {
        console.error(err);
      }
    };

    const refreshLocalStats = () => {
      setCompletedItems(getCompletedItems());
      setTotalXP(getTotalXP());
      setMissionDone(getCompletedMissions());
      setActiveMissions(getActiveMissions());
      const progressMap: Record<string, { current: number; target: number }> = {};
      missionsData.forEach((m) => {
        progressMap[m.id] = getMissionProgress(m.id);
      });
      setMissionProgressMap(progressMap);
      setRecentActivityLog(JSON.parse(localStorage.getItem("recentActivity") || "[]"));
    };

    const loadDashboard = async () => {
      try {
        const dashboardData = await api.getDashboard();
        setData(dashboardData);
        if (dashboardData?.user) {
          localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(dashboardData.user));
          setCachedProfile(dashboardData.user);
        }
        animate(count, dashboardData.portfolioSummary.totalValue, { duration: 2, ease: "easeOut" });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    refreshLocalStats();
    refreshIndices();
    const onMissionEvent = () => refreshLocalStats();
    const onNewMissions = () => {
      setNewMissionBanner(true);
      setTimeout(() => setNewMissionBanner(false), 2500);
      refreshLocalStats();
    };
    window.addEventListener("mission-completed", onMissionEvent);
    window.addEventListener("mission-progress", onMissionEvent);
    window.addEventListener("new-missions-unlocked", onNewMissions);
    const interval = setInterval(async () => {
      await refreshIndices();
    }, 10000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("mission-completed", onMissionEvent);
      window.removeEventListener("mission-progress", onMissionEvent);
      window.removeEventListener("new-missions-unlocked", onNewMissions);
    };
  }, [count]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary text-accent-gold">
        <RefreshCw className="animate-spin mr-2" /> Loading Dashboard...
      </div>
    );
  }

  const { user, portfolioSummary, dailyPnlPct, shouldTriggerLossDebrief } = data;
  const streakCount = user?.streakCount ?? user?.daysActive ?? 0;
  const displayName = user?.name || cachedProfile?.name || 'Investor';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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
  const currentLevel = getCurrentLevel();
  const xpProgress = getXPProgress(totalXP);

  const handleHonorMark = (mission: any) => {
    if (isMissionComplete(mission.id)) return;
    setConfirmMission(mission);
  };

  const confirmHonorMission = () => {
    if (!confirmMission) return;
    const mission = confirmMission;
    setConfirmMission(null);
    const xpAwarded = completeMission(mission.id, mission.xp, { allowHonor: true });
    if (xpAwarded > 0) {
      addXP(mission.xp, `Completed mission: ${mission.title}`);
      addRecentActivity(`Completed Mission: ${mission.title}`);
      const advanced = checkAndAdvanceBatch();
      setXpMessage(`+${mission.xp} XP earned!`);
      setTimeout(() => setXpMessage(null), 2000);
      const now = Date.now();
      localStorage.setItem(`mission_completed_at_${mission.id}`, String(now));
      setUndoState({ open: true, missionId: mission.id, xp: mission.xp, title: mission.title, timeoutAt: now + 60000 });
      setTimeout(() => {
        setUndoState((s) => (s.missionId === mission.id ? { open: false } : s));
      }, 60000);
      window.dispatchEvent(new CustomEvent("mission-completed", { detail: { missionId: mission.id } }));
      if (advanced) {
        window.dispatchEvent(new CustomEvent("new-missions-unlocked"));
      }
    }
  };

  const undoHonorMission = () => {
    if (!undoState.open || !undoState.missionId || !undoState.timeoutAt) return;
    if (Date.now() > undoState.timeoutAt) {
      setUndoState({ open: false });
      return;
    }
    const completed = getCompletedMissions().filter((id) => id !== undoState.missionId);
    localStorage.setItem("completedMissions", JSON.stringify(completed));
    addXP(-(undoState.xp || 0), `Undid mission: ${undoState.title || undoState.missionId}`);
    removeRecentActivityByText(`Completed Mission: ${undoState.title}`);
    localStorage.removeItem(`mission_completed_at_${undoState.missionId}`);
    setUndoState({ open: false });
    setXpMessage("Mission completion undone");
    setTimeout(() => setXpMessage(null), 1800);
    window.dispatchEvent(new CustomEvent("mission-progress", { detail: { missionId: undoState.missionId } }));
  };

  const globalItems = Array.isArray(indices?.global) ? indices.global : [];
  const findGlobalByName = (text: string) =>
    globalItems.find((item: any) => String(item?.name || '').toLowerCase().includes(text.toLowerCase()));

  const niftyItem = indices?.nifty || MANDATORY_FALLBACKS.nifty;
  const sensexItem = indices?.sensex || MANDATORY_FALLBACKS.sensex;
  const goldItem = findGlobalByName('gold') || MANDATORY_FALLBACKS.gold;
  const silverItem = findGlobalByName('silver') || MANDATORY_FALLBACKS.silver;

  const additionalItems = globalItems
    .filter((item: any) => !['gold', 'silver'].some((k) => String(item?.name || '').toLowerCase().includes(k)))
    .slice(0, 2);

  const marketItems = [niftyItem, sensexItem, goldItem, silverItem, ...additionalItems];
  const formatValue = (v: any) =>
    typeof v === 'number' && Number.isFinite(v) && v > 0
      ? Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })
      : '--';
  // Magnitude only — direction comes from ▲/▼ and color (matches Finnhub dp sign via isUp).
  const formatChange = (v: any) =>
    typeof v === 'number' && Number.isFinite(v)
      ? Math.abs(Number(v)).toLocaleString('en-IN', { maximumFractionDigits: 2 })
      : '--';
  const formatPct = (v: any) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.abs(Number(v)).toFixed(2) : '--';

  function handleContinueLearning() {
    const next = getNextIncompleteItem(courseData);
    if (!next) {
      setShowCongrats(true);
    } else {
      navigate(`/learn/${next.module.id}/${next.lesson.id}`);
    }
  }

  const handleRefreshDashboard = async () => {
    setIsRefreshing(true);
    try {
      const [dashboardData, latestIndices] = await Promise.all([
        api.getDashboard(),
        api.getMarketIndices(),
      ]);
      setData(dashboardData);
      if (dashboardData?.user) {
        localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(dashboardData.user));
        setCachedProfile(dashboardData.user);
      }
      setIndices((prev: any) => ({
        ...prev,
        ...latestIndices,
        nifty: latestIndices?.nifty || prev?.nifty || null,
        sensex: latestIndices?.sensex || prev?.sensex || null,
        global:
          Array.isArray(latestIndices?.global) && latestIndices.global.length > 0
            ? latestIndices.global
            : Array.isArray(prev?.global)
            ? prev.global
            : [],
      }));
      setCompletedItems(getCompletedItems());
      setTotalXP(getTotalXP());
      setMissionDone(missionsData.filter((m) => isMissionComplete(m.id)).map((m) => m.id));
      setRecentActivityLog(JSON.parse(localStorage.getItem("recentActivity") || "[]"));
      animate(count, dashboardData.portfolioSummary.totalValue, { duration: 1.2, ease: "easeOut" });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-bg-primary bg-dots flex flex-col">
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border">
        <div className="h-[60px] flex items-center justify-between px-4">
          <span className="font-heading font-bold text-base">{greeting}, {displayName.split(' ')[0]} 👋</span>
          <button
            onClick={handleRefreshDashboard}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-border text-text-muted"
            aria-label="Refresh dashboard"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="h-[30px] bg-bg-secondary border-t border-border overflow-hidden flex items-center">
          <div className="flex animate-ticker whitespace-nowrap">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center space-x-6 px-4">
                {marketItems.map((item: any, idx: number) => {
                  const hasNumericPct = typeof item?.changePct === 'number' && Number.isFinite(item.changePct);
                  const isUp = hasNumericPct ? Number(item.changePct) >= 0 : true;
                  return (
                    <React.Fragment key={`${item?.name || 'market'}-${idx}`}>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono whitespace-nowrap text-text-muted">{item?.name || 'MARKET'}</span>
                        <span className="text-[11px] font-mono whitespace-nowrap font-bold">
                          {formatValue(item?.value)}
                        </span>
                        <span className={`text-[11px] font-mono whitespace-nowrap font-bold ${isUp ? 'text-accent-green' : 'text-accent-red'}`}>
                          {isUp ? '▲' : '▼'}{formatChange(item?.change)} ({formatPct(item?.changePct)}%)
                        </span>
                      </div>
                      <span className="text-border">|</span>
                    </React.Fragment>
                  );
                })}
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
                <span className="text-[10px] font-bold text-accent-gold">{currentLevel.emoji} {currentLevel.name}</span>
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
                <p className="text-[18px] font-mono font-bold text-text-primary">{streakCount} Days</p>
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

          <motion.div variants={itemVariants} className="bg-bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-heading font-bold">Learning Progress</h3>
              <span className="text-[11px] text-text-muted">{completedItems.length} completed</span>
            </div>
            <button
              onClick={handleContinueLearning}
              className="w-full py-3 rounded-xl bg-accent-gold text-bg-primary font-bold text-sm"
            >
              Continue Learning
            </button>
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
                    animate={{ width: `${xpProgress.percent}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-accent-gold"
                  />
                </div>
              </div>
              <button onClick={() => navigate('/profile')} className="text-xs font-bold text-accent-gold uppercase tracking-wider">
                {totalXP} XP →
              </button>
            </div>
            {xpMessage && <p className="text-xs text-accent-gold font-bold">{xpMessage}</p>}
            {newMissionBanner && <p className="text-xs text-accent-green font-bold">🎯 New Missions Unlocked!</p>}

            <div className="space-y-3">
              {activeMissions.map((m: any, i: number) => {
                const isComplete = missionDone.includes(m.id);
                const progress = missionProgressMap[m.id] || { current: 0, target: m.target || 1 };
                return (
                  <div
                    key={i}
                    className={`w-full flex items-center p-4 rounded-xl border border-border text-left ${isComplete ? 'bg-bg-card opacity-80' : 'bg-bg-card'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${isComplete ? 'bg-accent-green/20' : 'bg-accent-gold/20'}`}>
                      {isComplete ? <CheckCircle2 size={18} className="text-accent-green" /> : <RefreshCw size={18} className="text-accent-gold animate-spin-slow" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm text-text-primary ${isComplete ? 'line-through decoration-text-muted' : ''}`}>{m.title}</p>
                      {!isComplete && <p className="text-[10px] text-accent-gold mt-1">{m.description}</p>}
                      {!isComplete && (m.verificationType === 'auto' || m.verificationType === 'progress') && (
                        <p className="text-[10px] text-text-muted mt-1">Auto-tracked</p>
                      )}
                      {!isComplete && m.verificationType === 'progress' && (
                        <p className="text-[10px] text-text-muted">{progress.current}/{progress.target} complete</p>
                      )}
                    </div>
                    {!isComplete && m.verificationType === 'honor' && (
                      <button
                        onClick={() => handleHonorMark(m)}
                        className="mr-2 px-3 py-1 rounded-lg bg-accent-gold text-bg-primary text-[10px] font-bold"
                      >
                        Mark as Done
                      </button>
                    )}
                    <div className={`px-2 py-0.5 rounded border ${isComplete ? 'bg-accent-green/10 border-accent-green/20 text-accent-green' : 'bg-accent-gold/10 border-accent-gold/20 text-accent-gold'}`}>
                      <span className="text-[10px] font-bold">+{m.xp} XP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4 pb-4">
            <h2 className="text-lg font-heading font-bold text-text-primary">Recent Activity</h2>
            <div className="relative pl-6 space-y-6">
              <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-accent-gold/30" />
              {recentActivityLog.length === 0 ? (
                <p className="text-xs text-text-muted">No activity yet. Start trading or learning!</p>
              ) : (
                recentActivityLog.slice(0, 5).map((act: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-bg-primary ${String(act.text || '').toLowerCase().includes('trade') ? 'bg-accent-green' : 'bg-accent-gold'}`} />
                    <p className="text-[13px] font-mono text-text-primary">{act.text}</p>
                    <p className="text-[11px] text-text-muted">{new Date(act.date).toLocaleDateString('en-GB')}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      </main>
      <CongratsModal isOpen={showCongrats} onClose={() => setShowCongrats(false)} />
      <MissionConfirmModal
        isOpen={!!confirmMission}
        mission={confirmMission}
        onConfirm={confirmHonorMission}
        onCancel={() => setConfirmMission(null)}
      />
      <UndoSnackbar
        open={undoState.open}
        text="Mission marked complete. Undo?"
        onUndo={undoHonorMission}
      />
    </div>
  );
}
