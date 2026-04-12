import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion';
import { 
  Home, 
  BookOpen, 
  BarChart2, 
  History, 
  User,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface Holding {
  symbol: string;
  name: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  color: string;
  percentage: number;
}

const INITIAL_HOLDINGS: Holding[] = [
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', qty: 15, avgPrice: 820, currentPrice: 924.45, color: '#4A9EFF', percentage: 18 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', qty: 5, avgPrice: 3200, currentPrice: 3421.55, color: '#A855F7', percentage: 15 },
  { symbol: 'RELIANCE', name: 'Reliance Industries', qty: 8, avgPrice: 2801, currentPrice: 2847.30, color: '#F0A500', percentage: 14 },
  { symbol: 'ZOMATO', name: 'Zomato Limited', qty: 50, avgPrice: 195, currentPrice: 182.30, color: '#F97316', percentage: 11 },
  { symbol: 'YESBANK', name: 'Yes Bank Limited', qty: 100, avgPrice: 36, currentPrice: 24.15, color: '#FF4757', percentage: 9 },
];

const TRANSACTIONS = [
  { type: 'BUY', symbol: 'RELIANCE', qty: 5, price: 2847, total: 14235, time: '2hr ago' },
  { type: 'SELL', symbol: 'ZOMATO', qty: 10, price: 182, total: 1820, time: 'Yesterday' },
  { type: 'BUY', symbol: 'TCS', qty: 2, price: 3400, total: 6800, time: '2 days ago' },
  { type: 'BUY', symbol: 'TATAMOTORS', qty: 5, price: 895, total: 4475, time: '3 days ago' },
  { type: 'BUY', symbol: 'YESBANK', qty: 50, price: 36, total: 1800, time: '5 days ago' },
];

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
              style={{ strokeDashoffset: circumference - (segment.value / 100) * circumference, transform: `rotate(${(offset / circumference) * 360}deg)`, transformOrigin: 'center' }}
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
  const [sortBy, setSortBy] = useState('P&L');
  const [isRefreshingAI, setIsRefreshingAI] = useState(false);

  const sortedHoldings = useMemo(() => {
    const list = [...INITIAL_HOLDINGS];
    switch (sortBy) {
      case 'P&L':
        return list.sort((a, b) => (b.currentPrice - b.avgPrice) * b.qty - (a.currentPrice - a.avgPrice) * a.qty);
      case 'Value':
        return list.sort((a, b) => (b.currentPrice * b.qty) - (a.currentPrice * a.qty));
      case 'Name':
        return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
      case '% Returns':
        return list.sort((a, b) => (b.currentPrice / b.avgPrice) - (a.currentPrice / a.avgPrice));
      default:
        return list;
    }
  }, [sortBy]);

  const handleRefreshAI = () => {
    setIsRefreshingAI(true);
    setTimeout(() => setIsRefreshingAI(false), 1500);
  };

  return (
    <div className="relative min-h-screen w-full bg-bg-primary flex flex-col">
      {/* TOP BAR */}
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border h-[60px] flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full bg-accent-gold flex items-center justify-center font-bold text-black text-xs">
            AK
          </button>
          <h1 className="text-xl font-heading font-bold text-text-primary">💼 Portfolio</h1>
        </div>
        <div className="px-3 py-1 bg-accent-gold/10 border border-accent-gold/30 rounded-full">
          <span className="text-[10px] font-mono font-bold text-accent-gold uppercase tracking-wider">📄 Paper Mode</span>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 pt-[70px] pb-[90px] px-4 overflow-y-auto no-scrollbar">
        {/* SUMMARY HERO */}
        <div className="relative p-6 rounded-[24px] bg-bg-card border border-accent-gold/20 mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <div className="relative z-10">
            <p className="text-xs font-mono text-text-muted mb-1">Total Value</p>
            <h2 className="text-[48px] font-heading font-bold text-text-primary leading-tight mb-1">
              <CountUp value={114230} />
            </h2>
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-sm font-mono font-bold text-accent-green">+₹14,230 (+14.2%)</span>
              <span className="text-[10px] text-text-muted">Since you started</span>
            </div>

            <div className="h-[1px] bg-border/50 w-full mb-6" />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-lg font-mono font-bold text-text-primary">₹37,450</p>
                <p className="text-[10px] text-text-muted uppercase tracking-widest">Cash</p>
              </div>
              <div>
                <p className="text-lg font-mono font-bold text-text-primary">₹76,780</p>
                <p className="text-[10px] text-text-muted uppercase tracking-widest">Invested</p>
              </div>
              <div>
                <p className="text-lg font-mono font-bold text-accent-green">₹14,230</p>
                <p className="text-[10px] text-text-muted uppercase tracking-widest">Returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* DONUT CHART */}
        <div className="mb-10">
          <DonutChart holdings={INITIAL_HOLDINGS} cashPercentage={33} />
          
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 mt-4">
            {INITIAL_HOLDINGS.map((h, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                <span className="text-[11px] font-mono text-text-muted uppercase">{h.symbol}</span>
                <span className="text-[11px] font-mono font-bold text-text-primary">{h.percentage}%</span>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-[#2A2A3E]" />
              <span className="text-[11px] font-mono text-text-muted uppercase">CASH</span>
              <span className="text-[11px] font-mono font-bold text-text-primary">33%</span>
            </div>
          </div>
        </div>

        {/* DIVERSITY SCORE */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-1">Portfolio Diversity Score</p>
              <h3 className="text-[32px] font-heading font-bold text-accent-gold">7.4 <span className="text-lg text-text-muted">/ 10</span></h3>
            </div>
            <div className="flex space-x-0.5">
              {[1, 2, 3, 4].map(i => <Star key={i} size={16} className="fill-accent-gold text-accent-gold" />)}
              <Star size={16} className="fill-accent-gold/30 text-accent-gold/30" />
            </div>
          </div>
          
          <div className="h-2 w-full bg-bg-primary rounded-full overflow-hidden mb-6">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '74%' }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-accent-gold"
            />
          </div>

          <div className="bg-accent-gold/5 border-l-4 border-accent-gold p-4 rounded-r-xl">
            <div className="flex items-center space-x-2 mb-1">
              <AlertTriangle size={14} className="text-accent-gold" />
              <p className="text-xs font-bold text-accent-gold">Concentration Alert</p>
            </div>
            <p className="text-xs text-text-primary leading-relaxed opacity-80">
              You have 33% cash sitting idle. Consider deploying it gradually to beat inflation.
            </p>
          </div>
        </div>

        {/* AI ANALYSIS */}
        <div className="bg-bg-card border border-accent-gold/30 rounded-2xl p-5 mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3">
            <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">Claude AI</span>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-xl">🤖</span>
            <h3 className="text-sm font-heading font-bold text-text-primary">AI Portfolio Analysis</h3>
          </div>

          <div className="space-y-4 text-[13px] text-text-primary leading-relaxed">
            <p>Overall you're doing well for a beginner! 🎉</p>
            
            <div className="space-y-2">
              <p className="font-bold text-accent-green">✅ Strengths:</p>
              <ul className="space-y-1 pl-2">
                <li>• Good sector mix — tech + auto + energy</li>
                <li>• TATAMOTORS position showing great momentum</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-accent-red">⚠️ Watch out:</p>
              <ul className="space-y-1 pl-2">
                <li>• Yes Bank is dragging your returns — consider your exit strategy</li>
                <li>• 33% cash is too much — money sitting idle loses to inflation</li>
              </ul>
            </div>

            <div className="bg-bg-primary/50 p-3 rounded-xl border border-border/50">
              <p className="font-bold text-accent-gold mb-1">💡 Suggestion:</p>
              <p className="text-xs italic opacity-80">
                Consider a monthly SIP into a NIFTY 50 index fund with that idle cash. Boring? Yes. Effective? Extremely.
              </p>
            </div>
          </div>

          <button 
            onClick={handleRefreshAI}
            className="w-full mt-6 py-2 border border-border rounded-xl text-[11px] font-bold text-text-muted flex items-center justify-center space-x-2"
          >
            <RefreshCw size={12} className={isRefreshingAI ? "animate-spin" : ""} />
            <span>{isRefreshingAI ? "Analyzing Portfolio..." : "Refresh Analysis ↻"}</span>
          </button>
        </div>

        {/* HOLDINGS LIST */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-heading font-bold text-text-primary">Holdings ({INITIAL_HOLDINGS.length})</h2>
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
            {sortedHoldings.map((h, i) => {
              const pnl = (h.currentPrice - h.avgPrice) * h.qty;
              const pnlPercent = ((h.currentPrice / h.avgPrice) - 1) * 100;
              const isPositive = pnl >= 0;
              
              return (
                <motion.div 
                  key={h.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(`/trade/${h.symbol}`)}
                  className={`bg-bg-card p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                    isPositive ? 'border-accent-green/20 hover:border-accent-green/40' : 'border-accent-red/20 hover:border-accent-red/40'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-bg-primary flex items-center justify-center text-lg font-bold border border-border">
                        {h.symbol[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-mono font-bold text-text-primary">{h.symbol}</h4>
                        <p className="text-[10px] text-text-muted">{h.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-text-primary">₹{(h.currentPrice * h.qty).toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] text-text-muted font-mono">
                      {h.qty} shares × ₹{h.avgPrice}
                    </p>
                    <p className="text-[10px] text-text-muted font-mono">
                      LTP: ₹{h.currentPrice}
                    </p>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className={`flex items-center space-x-1 font-mono font-bold ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                      {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span className="text-sm">{isPositive ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN')}</span>
                      <span className="text-[10px]">({isPositive ? '+' : ''}{pnlPercent.toFixed(1)}%)</span>
                    </div>
                    
                    {/* Tiny Sparkline Mock */}
                    <div className="w-[60px] h-[20px] flex items-end space-x-0.5">
                      {[40, 60, 45, 70, 55, 80, 75].map((hVal, idx) => (
                        <div 
                          key={idx} 
                          className={`flex-1 rounded-t-sm ${isPositive ? 'bg-accent-green/40' : 'bg-accent-red/40'}`} 
                          style={{ height: `${hVal}%` }} 
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* TRANSACTION HISTORY */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-heading font-bold text-text-primary">Transaction History</h2>
            <button className="text-xs font-bold text-accent-gold">See All →</button>
          </div>

          <div className="space-y-4">
            {TRANSACTIONS.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center space-x-4">
                  <div className={`px-2 py-1 rounded text-[9px] font-bold ${
                    t.type === 'BUY' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'
                  }`}>
                    {t.type}
                  </div>
                  <div>
                    <h4 className="text-sm font-mono font-bold text-text-primary">{t.symbol}</h4>
                    <p className="text-[10px] text-text-muted">{t.qty} shares @ ₹{t.price}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-text-primary">₹{t.total.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-text-muted">{t.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
