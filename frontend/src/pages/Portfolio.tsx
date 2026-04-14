import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion';
import { 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { api } from '../api';

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

export default function Portfolio() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('P&L');
  const [isRefreshingAI, setIsRefreshingAI] = useState(false);
  const [isRefreshingPortfolio, setIsRefreshingPortfolio] = useState(false);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const portData = await api.getPortfolio();
        setData(portData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRefreshAI = async () => {
    setIsRefreshingAI(true);
    setShowDetailedInsight(false);
    try {
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      console.log('[Portfolio] Sending AI analysis request', { requestId });
      const insight = await api.analyzePortfolio(requestId);
      console.log('[Portfolio] AI analysis response', insight);
      setAiInsight(insight);
    } catch(err) {
      console.error(err);
    } finally {
      setIsRefreshingAI(false);
    }
  };

  const handleRefreshPortfolio = async () => {
    setIsRefreshingPortfolio(true);
    try {
      const portData = await api.getPortfolio();
      setData(portData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshingPortfolio(false);
    }
  };

  const sortedHoldings = useMemo(() => {
    if (!data) return [];
    const list = [...data.holdings];
    switch (sortBy) {
      case 'P&L':
        return list.sort((a, b) => ((b.currentPrice - b.avgBuyPrice) * b.quantity) - ((a.currentPrice - a.avgBuyPrice) * a.quantity));
      case 'Value':
        return list.sort((a, b) => (b.currentPrice * b.quantity) - (a.currentPrice * a.quantity));
      case 'Name':
        return list.sort((a, b) => a.stockSymbol.localeCompare(b.stockSymbol));
      case '% Returns':
        return list.sort((a, b) => (b.currentPrice / b.avgBuyPrice) - (a.currentPrice / a.avgBuyPrice));
      default:
        return list;
    }
  }, [sortBy, data]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary text-accent-gold">
        <RefreshCw className="animate-spin mr-2" /> Loading Portfolio...
      </div>
    );
  }

  const holdings = data.holdings || [];
  const transactions = data.transactions || [];
  const metrics = data.metrics || {
    totalValue: Number(data.totalPortfolioValue || 0),
    totalPnl: Number(data.totalPnl || 0),
    totalPnlPct: Number(data.totalPnlPct || 0),
    virtualCash: Number(data.virtualCash || 0),
    diversityScore: Number(data.diversityScore || 0),
  };
  const cashPercentage = metrics.totalValue > 0 ? (metrics.virtualCash / metrics.totalValue) * 100 : 100;
  
  // Apply visual colors to holdings
  const colors = ['#4A9EFF', '#A855F7', '#F0A500', '#F97316', '#FF4757', '#00D4A1'];
  const enrichedHoldings = holdings.map((h: any, i: number) => ({
    ...h,
    color: colors[i % colors.length],
    percentage: metrics.totalValue > 0 ? ((h.currentPrice * h.quantity) / metrics.totalValue) * 100 : 0
  }));

  return (
    <div className="relative min-h-screen w-full bg-bg-primary flex flex-col">
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border h-[60px] flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full bg-accent-gold flex items-center justify-center font-bold text-black text-xs">
            AK
          </button>
          <h1 className="text-xl font-heading font-bold text-text-primary">💼 Portfolio</h1>
        </div>
        <button
          onClick={handleRefreshPortfolio}
          disabled={isRefreshingPortfolio}
          className="p-2 rounded-lg border border-border text-text-muted"
          aria-label="Refresh portfolio"
        >
          <RefreshCw size={16} className={isRefreshingPortfolio ? "animate-spin" : ""} />
        </button>
      </header>

      <main className="flex-1 pt-[70px] pb-[90px] px-4 overflow-y-auto no-scrollbar">
        {/* SUMMARY HERO */}
        <div className="relative p-6 rounded-[24px] bg-bg-card border border-accent-gold/20 mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <div className="relative z-10">
            <p className="text-xs font-mono text-text-muted mb-1">Total Value</p>
            <h2 className="text-[48px] font-heading font-bold text-text-primary leading-tight mb-1">
              <CountUp value={metrics.totalValue || 100000} />
            </h2>
            <div className="flex items-center space-x-2 mb-6">
              <span className={`text-sm font-mono font-bold ${metrics.totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {metrics.totalPnl >= 0 ? '+' : ''}₹{metrics.totalPnl} ({metrics.totalPnlPct}%)
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

        {/* DONUT CHART */}
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

        {/* DIVERSITY SCORE */}
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
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(metrics.diversityScore / 10) * 100}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-accent-gold"
            />
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

        {/* AI ANALYSIS */}
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

          <button 
            onClick={handleRefreshAI}
            className="w-full mt-6 py-2 border border-border rounded-xl text-[11px] font-bold text-text-muted flex items-center justify-center space-x-2"
          >
            <RefreshCw size={12} className={isRefreshingAI ? "animate-spin" : ""} />
            <span>{isRefreshingAI ? "Analyzing Portfolio..." : aiInsight ? "Refresh Analysis ↻" : "Generate Core Analysis"}</span>
          </button>
        </div>

        {/* HOLDINGS LIST */}
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
                  className={`bg-bg-card p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                    isPositive ? 'border-accent-green/20 hover:border-accent-green/40' : 'border-accent-red/20 hover:border-accent-red/40'
                  }`}
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
                    <p className="text-[10px] text-text-muted font-mono">
                      {h.quantity} shares × ₹{h.avgBuyPrice.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-text-muted font-mono">
                      LTP: ₹{h.currentPrice.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className={`flex items-center space-x-1 font-mono font-bold ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                      {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span className="text-sm">{isPositive ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                      <span className="text-[10px]">({isPositive ? '+' : ''}{pnlPercent.toFixed(1)}%)</span>
                    </div>
                  </div>
                </motion.div>
              );
            }))}
          </div>
        </div>

        {/* TRANSACTION HISTORY */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-heading font-bold text-text-primary">Transaction History</h2>
            <button className="text-xs font-bold text-accent-gold">See All →</button>
          </div>

          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-center text-text-muted text-xs">No entries in the ledger.</p>
            ) : (
              [...transactions].reverse().slice(0, 10).map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center space-x-4">
                    <div className={`px-2 py-1 rounded text-[9px] font-bold ${
                      t.type === 'BUY' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'
                    }`}>
                      {t.type}
                    </div>
                    <div>
                      <h4 className="text-sm font-mono font-bold text-text-primary">{t.stockSymbol}</h4>
                      <p className="text-[10px] text-text-muted">{t.quantity} shares @ ₹{Number(t.executionPrice ?? t.price ?? 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-text-primary">₹{t.totalAmount.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-text-muted">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
