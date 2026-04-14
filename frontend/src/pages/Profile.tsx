import React, { useEffect, useMemo, useState } from 'react';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Settings,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronDown,
  Star
} from 'lucide-react';
import { api } from '../api';
import { getCurrentLevel, getTotalXP, getXPProgress, LEVELS } from '../utils/xpUtils';
import { applyLivePricesToPortfolio, getPortfolioStats, refreshHoldingPrices } from '../utils/priceRefresh';
import { scopedKey } from '../utils/userScopedStorage';

interface Holding {
  stockSymbol: string;
  quantity: number;
  avgBuyPrice: number;
  currentValue?: number;
  currentPrice: number;
  color: string;
  percentage: number;
}

const DonutChart = ({ holdings, cashPercentage }: { holdings: Holding[], cashPercentage: number }) => {
  const radius = 70;
  const strokeWidth = 20;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  const data = [
    ...holdings.map(h => ({ value: h.percentage, color: h.color })),
    { value: cashPercentage, color: '#2A2A3E' }
  ];

  let currentOffset = 0;

  return (
    <div className="relative flex justify-center items-center py-8">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        {data.map((segment, i) => {
          const strokeDashoffset = circumference - (segment.value / 100) * circumference;
          const offset = currentOffset;
          currentOffset += (segment.value / 100) * circumference;
          
          return (
            <circle
              key={i}
              stroke={segment.color}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset, transform: `rotate(${(offset / circumference) * 360}deg)`, transformOrigin: 'center' }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="transition-all duration-1000 ease-out"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-lg font-heading font-bold text-text-primary">{holdings.length + 1}</span>
        <span className="text-[10px] text-text-muted uppercase tracking-widest">Assets</span>
      </div>
    </div>
  );
};

const CountUp = ({ value, prefix = "₹" }: { value: number, prefix?: string }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => 
    `${prefix}${Math.round(latest).toLocaleString('en-IN')}`
  );

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: "easeOut" });
    return () => controls.stop();
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
};

export default function Profile() {
  const navigate = useNavigate();
  const USER_PROFILE_CACHE_KEY = scopedKey('stockit_user_profile_cache');
  const [userData, setUserData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem(USER_PROFILE_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [sortBy, setSortBy] = useState('P&L');
  const [isRefreshingAI, setIsRefreshingAI] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [showDetailedInsight, setShowDetailedInsight] = useState(false);
  const parsedAiInsight = useMemo(() => {
    const text = String(aiInsight?.insight || '').trim();
    if (!text) return { bullets: [] as string[], detailed: '' };
    const detailedMatch = text.match(/DETAILED:\s*([\s\S]*)$/i);
    const conciseRaw = (detailedMatch ? text.slice(0, detailedMatch.index) : text).replace(/CONCISE BULLETS:\s*/i, '').trim();
    const detailed = detailedMatch ? detailedMatch[1].trim() : '';
    const bullets = conciseRaw
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .map((line: string) => line.replace(/^[-*]\s+/, '').replace(/^\d+[\).\s-]+/, ''));
    return { bullets, detailed };
  }, [aiInsight]);
  const streakCount = userData?.streakCount ?? userData?.daysActive ?? 0;
  const displayName = userData?.name || 'Investor';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'IN';
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsRefreshingPrices(true);
        const [dashboard, portfolio] = await Promise.all([
          api.getDashboard(),
          api.getPortfolio()
        ]);
        const symbols = (portfolio?.holdings || []).map((h: any) => h.stockSymbol);
        const livePrices = await refreshHoldingPrices(symbols);
        const portfolioWithLivePrices = applyLivePricesToPortfolio(portfolio, livePrices);
        setUserData(dashboard?.user || null);
        if (dashboard?.user) {
          localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(dashboard.user));
        }
        setPortfolioData(portfolioWithLivePrices);
      } catch (err) {
        console.error(err);
      } finally {
        setIsRefreshingPrices(false);
      }
    };
    loadUser();
  }, []);

  const handleRefreshAI = async () => {
    setIsRefreshingAI(true);
    setShowDetailedInsight(false);
    try {
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const insight = await api.analyzePortfolio(requestId);
      setAiInsight(insight);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshingAI(false);
    }
  };

  const holdings = portfolioData?.holdings || [];
  const transactions = portfolioData?.transactions || [];
  const metrics = {
    totalValue: Number(portfolioData?.totalPortfolioValue || 0),
    totalPnl: Number(portfolioData?.totalPnl || 0),
    totalPnlPct: Number(portfolioData?.totalPnlPct || 0),
    virtualCash: Number(portfolioData?.virtualCash || 0),
    diversityScore: Number(portfolioData?.diversityScore || 0),
  };
  const portfolioStats = useMemo(() => getPortfolioStats(portfolioData), [portfolioData]);
  const userXp = getTotalXP();
  const currentLevel = getCurrentLevel();
  const levelProgress = getXPProgress(userXp);
  const cashPercentage = metrics.totalValue > 0 ? (metrics.virtualCash / metrics.totalValue) * 100 : 100;
  const sortedHoldings = useMemo(() => {
    const list = [...holdings];
    switch (sortBy) {
      case 'P&L':
        return list.sort((a: any, b: any) => ((b.currentPrice - b.avgBuyPrice) * b.quantity) - ((a.currentPrice - a.avgBuyPrice) * a.quantity));
      case 'Value':
        return list.sort((a: any, b: any) => (b.currentPrice * b.quantity) - (a.currentPrice * a.quantity));
      case 'Name':
        return list.sort((a: any, b: any) => a.stockSymbol.localeCompare(b.stockSymbol));
      case '% Returns':
        return list.sort((a: any, b: any) => (b.currentPrice / b.avgBuyPrice) - (a.currentPrice / a.avgBuyPrice));
      default:
        return list;
    }
  }, [sortBy, holdings]);
  const colors = ['#4A9EFF', '#A855F7', '#F0A500', '#F97316', '#FF4757', '#00D4A1'];
  const enrichedHoldings = holdings.map((h: any, i: number) => ({
    ...h,
    color: colors[i % colors.length],
    percentage: metrics.totalValue > 0 ? ((h.currentPrice * h.quantity) / metrics.totalValue) * 100 : 0
  }));

  return (
    <div className="relative min-h-screen w-full bg-bg-primary flex flex-col font-mono text-text-primary">
      {/* TOP BAR */}
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border h-[60px] flex items-center justify-between px-4">
        <h1 className="text-xl font-heading font-bold">👤 Profile</h1>
        <Settings size={20} className="text-text-muted" />
      </header>

      {/* CONTENT */}
      <main className="flex-1 pt-[80px] pb-[100px] px-4 overflow-y-auto no-scrollbar">
        
        {/* SECTION 1: HERO */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-6 rounded-3xl bg-gradient-to-br from-accent-gold/10 to-transparent border border-accent-gold/20 mb-8 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 blur-3xl rounded-full -mr-16 -mt-16" />
          
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-accent-gold flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(240,165,0,0.3)]">
              <span className="text-2xl font-heading font-extrabold text-black">{initials}</span>
            </div>
            <h2 className="text-2xl font-heading font-bold text-text-primary">{displayName}</h2>
            <p className="text-xs text-text-muted mb-6">{userData?.email || ''}</p>
            
            <div className="w-full p-4 rounded-2xl border border-accent-gold/30 bg-bg-secondary/50 backdrop-blur-sm">
              <div className="text-sm font-heading font-bold text-accent-gold mb-3 tracking-wide">
                {currentLevel.emoji} {currentLevel.name}
              </div>
              <div className="h-2 bg-bg-primary rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress.percent}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-accent-gold shadow-[0_0_10px_#F0A500]"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-text-muted">{userXp} XP total</span>
                {levelProgress.nextLevel ? (
                  <span className="text-[10px] text-text-muted font-bold">
                    {levelProgress.xpInLevel} / {levelProgress.xpNeeded} XP to {levelProgress.nextLevel.emoji} {levelProgress.nextLevel.name}
                  </span>
                ) : (
                  <span className="text-[10px] text-text-muted font-bold">Max level reached</span>
                )}
              </div>
            </div>
            <div className="w-full mt-4 grid grid-cols-1 gap-2">
              {LEVELS.map((lvl) => {
                const active = lvl.id === currentLevel.id;
                const unlocked = userXp >= lvl.minXP;
                return (
                  <div key={lvl.id} className={`rounded-xl border px-3 py-2 text-left ${active ? 'border-accent-gold bg-accent-gold/10' : 'border-border'} ${unlocked ? '' : 'opacity-50'}`}>
                    <div className="text-xs font-bold">{lvl.emoji} {lvl.name} · {lvl.minXP}{Number.isFinite(lvl.maxXP) ? `-${lvl.maxXP}` : '+'} XP</div>
                    <div className="text-[10px] text-text-muted">{lvl.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* SECTION 2: STATS GRID */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {[
            {
              label: 'Total Return',
              value: isRefreshingPrices
                ? '—'
                : `${portfolioStats.totalReturn >= 0 ? '+' : ''}${portfolioStats.totalReturnPct.toFixed(2)}%`,
              color: portfolioStats.totalReturn >= 0 ? 'text-accent-green' : 'text-accent-red',
              sub: isRefreshingPrices
                ? 'Refreshing prices...'
                : `${portfolioStats.totalReturn >= 0 ? '+' : ''}₹${Math.abs(portfolioStats.totalReturn).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
            },
            {
              label: 'Best Holding',
              value: isRefreshingPrices
                ? '—'
                : (portfolioStats.bestPerformer?.symbol || '—'),
              color: 'text-accent-green',
              sub: isRefreshingPrices
                ? 'Refreshing prices...'
                : portfolioStats.bestPerformer
                ? `${portfolioStats.bestPerformer.pnlPct >= 0 ? '+' : ''}${portfolioStats.bestPerformer.pnlPct.toFixed(2)}%`
                : 'No holdings',
              isSmall: true
            },
            {
              label: 'Worst Holding',
              value: isRefreshingPrices
                ? '—'
                : (portfolioStats.worstPerformer?.symbol || '—'),
              color: 'text-accent-red',
              sub: isRefreshingPrices
                ? 'Refreshing prices...'
                : portfolioStats.worstPerformer
                ? `${portfolioStats.worstPerformer.pnlPct >= 0 ? '+' : ''}${portfolioStats.worstPerformer.pnlPct.toFixed(2)}%`
                : 'No holdings',
              isSmall: true
            },
            { label: 'Active Holdings', value: `${portfolioStats.holdingsCount}`, color: 'text-accent-gold', sub: 'Current positions' },
            { label: 'Total XP', value: `${userXp} XP`, color: 'text-accent-gold', sub: `${currentLevel.emoji} ${currentLevel.name}` },
            { label: 'Active Days', value: String(streakCount), color: 'text-text-primary', sub: 'Day Streak 🔥' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center"
            >
              <span className={`font-heading font-bold ${stat.isSmall ? 'text-sm' : 'text-2xl'} ${stat.color}`}>
                {stat.value}
              </span>
              <span className={`text-[10px] mt-1 ${stat.isSmall ? stat.color : 'text-text-muted'}`}>
                {stat.sub}
              </span>
            </motion.div>
          ))}
        </div>

        {/* SECTION 3: FULL PORTFOLIO CONTENT */}
        <div className="mb-8">
          <h3 className="text-xl font-heading font-bold mb-4 flex items-center">
            <span className="mr-2">💼</span> Portfolio
          </h3>

          {!portfolioData ? (
            <div className="p-4 rounded-xl bg-bg-card border border-border text-text-muted text-sm flex items-center">
              <RefreshCw size={14} className="animate-spin mr-2" />
              Loading portfolio...
            </div>
          ) : (
            <>
              <div className="relative p-6 rounded-[24px] bg-bg-card border border-accent-gold/20 mb-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="relative z-10">
                  <p className="text-xs font-mono text-text-muted mb-1">Total Value</p>
                  <h2 className="text-[48px] font-heading font-bold text-text-primary leading-tight mb-1">
                    {isRefreshingPrices ? '—' : <CountUp value={portfolioStats.totalValue} />}
                  </h2>
                  <div className="flex items-center space-x-2 mb-6">
                    <span className={`text-sm font-mono font-bold ${portfolioStats.totalReturn >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {isRefreshingPrices ? '—' : `${portfolioStats.totalReturn >= 0 ? '+' : ''}₹${portfolioStats.totalReturn.toFixed(2)} (${portfolioStats.totalReturnPct.toFixed(2)}%)`}
                    </span>
                    <span className="text-[10px] text-text-muted">Since you started</span>
                  </div>

                  <div className="h-[1px] bg-border/50 w-full mb-6" />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-lg font-mono font-bold text-text-primary">₹{metrics.virtualCash.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-widest">Cash</p>
                    </div>
                    <div>
                      <p className="text-lg font-mono font-bold text-text-primary">₹{(metrics.totalValue - metrics.virtualCash).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-widest">Invested</p>
                    </div>
                    <div>
                      <p className={`text-lg font-mono font-bold ${metrics.totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        ₹{metrics.totalPnl.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-text-muted uppercase tracking-widest">Returns</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-10">
                <DonutChart holdings={enrichedHoldings} cashPercentage={cashPercentage} />
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 mt-4">
                  {enrichedHoldings.map((h: any, i: number) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                      <span className="text-[11px] font-mono text-text-muted uppercase truncate w-20">{h.stockSymbol}</span>
                      <span className="text-[11px] font-mono font-bold text-text-primary">{h.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-[#2A2A3E]" />
                    <span className="text-[11px] font-mono text-text-muted uppercase">CASH</span>
                    <span className="text-[11px] font-mono font-bold text-text-primary">{cashPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-bg-card border border-border rounded-2xl p-5 mb-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-1">Portfolio Diversity Score</p>
                    <h3 className="text-[32px] font-heading font-bold text-accent-gold">{metrics.diversityScore} <span className="text-lg text-text-muted">/ 10</span></h3>
                  </div>
                  <div className="flex space-x-0.5">
                    {[...Array(10)].map((_, i) => (
                      <Star key={i} size={i < metrics.diversityScore ? 16 : 12} className={i < metrics.diversityScore ? "fill-accent-gold text-accent-gold" : "fill-accent-gold/30 text-accent-gold/30 mt-[2px]"} />
                    ))}
                  </div>
                </div>
                <div className="h-2 w-full bg-bg-primary rounded-full overflow-hidden mb-6">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(metrics.diversityScore / 10) * 100}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-accent-gold" />
                </div>
                {metrics.diversityScore < 5 && (
                  <div className="bg-accent-gold/5 border-l-4 border-accent-gold p-4 rounded-r-xl">
                    <div className="flex items-center space-x-2 mb-1">
                      <AlertTriangle size={14} className="text-accent-gold" />
                      <p className="text-xs font-bold text-accent-gold">Concentration Alert</p>
                    </div>
                    <p className="text-xs text-text-primary leading-relaxed opacity-80">
                      Your portfolio is highly concentrated. Consider buying diversified stocks.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-bg-card border border-accent-gold/30 rounded-2xl p-5 mb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                  <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">Groq Engine</span>
                </div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-xl">🤖</span>
                  <h3 className="text-sm font-heading font-bold text-text-primary">AI Portfolio Analysis</h3>
                </div>
                <div className="space-y-4 text-[13px] text-text-primary leading-relaxed">
                  {aiInsight ? (
                    <div className="space-y-3">
                      <ul className="list-disc pl-5 space-y-2">
                        {parsedAiInsight.bullets.map((point: string, idx: number) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                      {parsedAiInsight.detailed && (
                        <>
                          <button
                            onClick={() => setShowDetailedInsight((prev) => !prev)}
                            className="text-[12px] font-bold text-accent-gold border border-border rounded-lg px-3 py-1"
                          >
                            {showDetailedInsight ? 'Hide detailed view' : 'Understand in depth'}
                          </button>
                          {showDetailedInsight && (
                            <p className="text-text-primary/90">{parsedAiInsight.detailed}</p>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-text-muted italic">Click below to generate a deep dive analysis of your active positions.</p>
                  )}
                </div>
                <button onClick={handleRefreshAI} className="w-full mt-6 py-2 border border-border rounded-xl text-[11px] font-bold text-text-muted flex items-center justify-center space-x-2">
                  <RefreshCw size={12} className={isRefreshingAI ? "animate-spin" : ""} />
                  <span>{isRefreshingAI ? "Analyzing Portfolio..." : aiInsight ? "Refresh Analysis ↻" : "Generate Core Analysis"}</span>
                </button>
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-heading font-bold text-text-primary">Holdings ({holdings.length})</h2>
                  <div className="flex items-center space-x-1 text-xs text-text-muted">
                    <span>Sort by:</span>
                    <button
                      onClick={() => {
                        const options = ['P&L', 'Value', 'Name', '% Returns'];
                        const next = options[(options.indexOf(sortBy) + 1) % options.length];
                        setSortBy(next);
                      }}
                      className="flex items-center space-x-1 font-bold text-text-primary"
                    >
                      <span>{sortBy}</span>
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {holdings.length === 0 ? (
                    <p className="text-center text-text-muted text-xs">No active holdings. Buy some stocks!</p>
                  ) : (
                    sortedHoldings.map((h: any, i: number) => {
                      const pnl = (h.currentPrice - h.avgBuyPrice) * h.quantity;
                      const pnlPercent = ((h.currentPrice / h.avgBuyPrice) - 1) * 100;
                      const isPositive = pnl >= 0;
                      return (
                        <motion.div
                          key={h.stockSymbol}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => navigate(`/trade/${h.stockSymbol}`)}
                          className={`bg-bg-card p-4 rounded-2xl border transition-all active:scale-[0.98] ${isPositive ? 'border-accent-green/20 hover:border-accent-green/40' : 'border-accent-red/20 hover:border-accent-red/40'}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-bg-primary flex items-center justify-center text-lg font-bold border border-border">
                                {h.stockSymbol[0]}
                              </div>
                              <div>
                                <h4 className="text-sm font-mono font-bold text-text-primary">{h.stockSymbol}</h4>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono font-bold text-text-primary">₹{(h.currentPrice * h.quantity).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-[10px] text-text-muted font-mono">{h.quantity} shares × ₹{h.avgBuyPrice.toFixed(2)}</p>
                            <p className="text-[10px] text-text-muted font-mono">
                              LTP: {isRefreshingPrices ? '—' : `₹${h.currentPrice.toFixed(2)}`}
                            </p>
                          </div>
                          <div className="flex justify-between items-end">
                            <div className={`flex items-center space-x-1 font-mono font-bold ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                              <span className="text-sm">{isPositive ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                              <span className="text-[10px]">({isPositive ? '+' : ''}{pnlPercent.toFixed(1)}%)</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-heading font-bold text-text-primary">Transaction History</h2>
                  <button className="text-xs font-bold text-accent-gold">See All →</button>
                </div>
                <div className="space-y-4">
                  {Array.isArray(transactions) && transactions.length > 0 ? (
                    [...transactions].reverse().slice(0, 10).map((t: any, i: number) => (
                      <div key={t.id || `${t.stockSymbol}-${t.createdAt}-${i}`} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                        <div className="flex items-center space-x-4">
                          <div className={`px-2 py-1 rounded text-[9px] font-bold ${t.type === 'BUY' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                            {t.type}
                          </div>
                          <div>
                            <h4 className="text-sm font-mono font-bold text-text-primary">{t.stockSymbol}</h4>
                            <p className="text-[10px] text-text-muted">{t.quantity} shares @ ₹{Number(t.executionPrice ?? t.price ?? 0).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold text-text-primary">₹{Number(t.totalAmount || 0).toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-text-muted">{new Date(t.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-text-muted text-xs">No entries in the ledger.</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem('investsim_user_email');
                  localStorage.removeItem(USER_PROFILE_CACHE_KEY);
                  navigate('/onboarding');
                }}
                className="w-full py-4 rounded-2xl border border-accent-red/40 text-accent-red font-heading font-bold mb-6"
              >
                Log Out
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
