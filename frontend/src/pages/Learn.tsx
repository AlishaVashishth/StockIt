import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, CheckCircle2, Lock, History, Home as HomeIcon, 
  BarChart2, User, ArrowRight, Flame, ChevronRight, PlayCircle, RefreshCw, X,
  Lightbulb, Target
} from 'lucide-react';
import { api } from '../api';

interface ModuleCardProps {
  id: number;
  number: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'LOCKED' | 'LOCKED_TIER';
  title: string;
  description: string;
  caseStudy: string;
  progress: number;
  lessons: string;
  xp: string;
  isProminent?: boolean;
  onTap: (id: number, status: string) => void;
}

function ModuleCard({ 
  id, number, status, title, description, caseStudy, progress, lessons, xp, isProminent, onTap 
}: ModuleCardProps) {
  const isLocked = status.startsWith('LOCKED');
  
  return (
    <motion.div
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      onClick={() => onTap(id, status)}
      className={`relative p-5 rounded-[20px] border transition-all duration-300 mb-4 cursor-pointer overflow-hidden ${
        status === 'COMPLETED' ? 'bg-accent-green/[0.03] border-accent-green/30' :
        status === 'IN_PROGRESS' ? 'bg-accent-gold/[0.03] border-accent-gold shadow-[0_0_20px_rgba(240,165,0,0.1)]' :
        isLocked ? 'bg-bg-card border-border opacity-60' :
        'bg-bg-card border-border'
      } ${isProminent ? 'scale-[1.02]' : ''}`}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{number}</span>
        <div className={`px-2 py-0.5 rounded flex items-center space-x-1 ${
          status === 'COMPLETED' ? 'bg-accent-green/10 text-accent-green' :
          status === 'IN_PROGRESS' ? 'bg-accent-gold/10 text-accent-gold' :
          'bg-bg-secondary text-text-muted'
        }`}>
          {status === 'COMPLETED' && <CheckCircle2 size={10} />}
          {isLocked && <Lock size={10} />}
          <span className="text-[9px] font-bold uppercase tracking-wider">{status.replace('_', ' ')}</span>
        </div>
      </div>

      <h3 className={`text-xl font-heading font-bold mb-1 ${isLocked ? 'text-text-muted' : 'text-text-primary'}`}>
        {title}
      </h3>
      <p className="text-xs text-text-muted mb-4 leading-relaxed">{description}</p>
      
      {caseStudy && (
        <div className="bg-bg-secondary/50 rounded-lg px-3 py-2 mb-4 inline-block">
          <span className="text-[10px] font-mono text-text-primary">{caseStudy}</span>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex-1 h-1.5 bg-bg-secondary rounded-full mr-4 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full rounded-full ${status === 'COMPLETED' ? 'bg-accent-green' : 'bg-accent-gold'}`}
            />
          </div>
          <span className="text-[10px] font-mono text-text-muted whitespace-nowrap">{lessons}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className={`text-[10px] font-bold ${status === 'COMPLETED' ? 'text-accent-green' : 'text-text-muted'}`}>
            {status === 'COMPLETED' ? 'EARNED' : 'REWARD'}: {xp}
          </span>
          {isLocked && (
            <span className="text-[9px] text-accent-red font-bold uppercase tracking-tighter">
              {status === 'LOCKED_TIER' ? 'Reach Higher Tier to unlock' : 'Complete Module to unlock'}
            </span>
          )}
        </div>
      </div>

      {status === 'IN_PROGRESS' && (
        <button className="w-full mt-5 bg-accent-gold text-bg-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2">
          <span>Continue Learning</span>
          <ArrowRight size={16} />
        </button>
      )}

      {status === 'NOT_STARTED' && (
        <button className="w-full mt-5 border border-accent-gold text-accent-gold py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 bg-transparent">
          <span>Start Module</span>
          <PlayCircle size={16} />
        </button>
      )}

      {isLocked && <div className="absolute inset-0 bg-bg-primary/20 pointer-events-none" />}
    </motion.div>
  );
}

export default function Learn() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeConcept, setActiveConcept] = useState<any | null>(null);
  const streakCount = user?.streakCount ?? user?.daysActive ?? 0;

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modulesRes, userRes] = await Promise.all([
          api.getLearnModules(),
          api.getUser()
        ]);
        setData(modulesRes);
        setUser(userRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleModuleTap = (id: number, status: string) => {
    if (status.startsWith('LOCKED')) {
      showToast("🔒 Locked. Tier requirements not met.");
      return;
    }
    navigate(`/learn/${id}`);
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-bg-primary flex justify-center items-center text-accent-gold"><RefreshCw className="animate-spin mr-2"/> Loading Modules...</div>;
  }

  // Map backend module progress to UI
  const modules: ModuleCardProps[] = data.map((mod: any, index: number) => {
    let status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'LOCKED' | 'LOCKED_TIER' = 'NOT_STARTED';
    const completedLessons = Number(mod.completedLessons || 0);
    const totalLessons = Number(mod.totalLessons || 1);
    const progress = Math.min(100, Math.round((completedLessons / totalLessons) * 100));

    if (user.currentTier < mod.requiredTier) {
      status = 'LOCKED_TIER';
    } else if (completedLessons >= totalLessons) {
      status = 'COMPLETED';
    } else if (completedLessons > 0) {
      status = 'IN_PROGRESS';
    }

    return {
      id: mod.id,
      number: `MODULE 0${mod.id}`,
      status,
      title: mod.title,
      description: mod.description,
      caseStudy: mod.caseStudy,
      progress,
      lessons: `${completedLessons}/${mod.totalLessons} lessons`,
      xp: `+${mod.xpReward} XP`,
      isProminent: status === 'IN_PROGRESS',
      onTap: handleModuleTap
    };
  });

  const quickConcepts = [
    {
      title: '🐂 Bull vs Bear Market',
      time: '2 min',
      brief: 'A bull market is when prices rise broadly and optimism drives buying. A bear market is the opposite — prices fall 20%+ from recent highs and fear takes over. Both are completely normal parts of the market cycle.',
      example: 'During 2020–2021, Indian markets roared from 7,500 to 18,000 on NIFTY — a classic bull run. Then in 2022, global rate hikes triggered a bearish correction.',
      takeaway: 'Don\'t panic in a bear market. Historically, every bear market has been followed by a new bull run.',
    },
    {
      title: '📊 What is NIFTY 50?',
      time: '2 min',
      brief: 'NIFTY 50 is an index tracking 50 of India\'s largest and most liquid companies across sectors. It acts like a "temperature reading" for the Indian stock market.',
      example: 'If NIFTY rises 1% today, it means the combined performance of companies like Reliance, TCS, HDFC, and Infosys pushed the index up.',
      takeaway: 'Tracking NIFTY daily gives you a quick pulse of the entire Indian economy without looking at individual stocks.',
    },
    {
      title: '💰 What is a Dividend?',
      time: '3 min',
      brief: 'A dividend is a share of profit paid by a company to its shareholders. Stable, profitable companies like ITC or Coal India often pay dividends regularly as a reward for holding their stock.',
      example: 'If you own 100 shares of a company and it declares ₹5 dividend per share, you receive ₹500 — without selling a single share.',
      takeaway: 'Dividend stocks can create a passive income stream. Reinvesting dividends over time dramatically boosts long-term wealth.',
    },
    {
      title: '🛑 Stop Loss Explained',
      time: '2 min',
      brief: 'A stop loss is a pre-set exit price that automatically sells your stock if it falls to that level. It limits how much you can lose on a single trade.',
      example: 'You buy a stock at ₹500 and set a stop loss at ₹450. If it drops to ₹450, it sells automatically — you only lost ₹50, not ₹200.',
      takeaway: 'A stop loss isn\'t pessimism — it\'s discipline. Protecting capital is more important than chasing gains.',
    },
    {
      title: '📈 What is SIP?',
      time: '3 min',
      brief: 'SIP (Systematic Investment Plan) means investing a fixed amount at regular intervals — monthly or weekly — regardless of market conditions. It removes the pressure of "timing the market."',
      example: 'Investing ₹5,000 every month for 10 years in an index fund averaging 12% returns grows to over ₹11.6 lakhs — on just ₹6 lakhs invested.',
      takeaway: 'Time in the market beats timing the market. Start a SIP early, even if the amount is small.',
    },
    {
      title: '⚖️ Diversification',
      time: '2 min',
      brief: 'Diversification means spreading investments across different asset types, sectors, or geographies so a single loss doesn\'t wipe you out. It\'s the oldest risk management trick in investing.',
      example: 'If your entire portfolio is in one pharma stock and the sector crashes 30%, you\'re in trouble. But if pharma is just 15% of a mixed portfolio, the damage is contained.',
      takeaway: 'Never put all your eggs in one basket — especially if you can\'t afford to lose that basket.',
    },
    {
      title: '😨 What is FOMO in Markets?',
      time: '2 min',
      brief: 'FOMO (Fear of Missing Out) is the anxiety that makes investors buy into a rising stock or trend just because "everyone else is doing it." It\'s one of the most costly emotional mistakes in trading.',
      example: 'In 2021, many retail investors bought crypto at all-time highs purely out of FOMO after seeing others profit — only to see those assets crash 60–80% shortly after.',
      takeaway: 'If your reason to buy is "everyone\'s making money," that\'s FOMO — not a strategy. Stick to your thesis.',
    },
    {
      title: '📉 Volatility Simplified',
      time: '2 min',
      brief: 'Volatility measures how much a stock\'s price swings up or down. High volatility = big moves both ways. Low volatility = slow, stable movement. It\'s risk made visible.',
      example: 'A small-cap startup stock might swing 8% in a single day. A large-cap like TCS might only move 1–2%. Same market, very different volatility profiles.',
      takeaway: 'Higher volatility means higher potential returns — but also higher potential loss. Match volatility to your risk appetite.',
    },
    {
      title: '🧱 Support & Resistance',
      time: '3 min',
      brief: 'Support is a price level where a stock historically stops falling and bounces back. Resistance is where it struggles to break above. Traders use these zones to make buy/sell decisions.',
      example: 'If NIFTY has bounced from 22,000 three times, that\'s a strong support zone. Traders might buy near 22,000 expecting it to hold again.',
      takeaway: 'Price has memory. Identifying key support and resistance zones helps you enter and exit trades with better timing.',
    },
    {
      title: '📡 What is RSI?',
      time: '3 min',
      brief: 'RSI (Relative Strength Index) is a momentum indicator that tells you if a stock is overbought (too expensive, likely to fall) or oversold (too cheap, likely to bounce). It ranges from 0 to 100.',
      example: 'RSI above 70 signals overbought — the stock may be due for a pullback. RSI below 30 signals oversold — it might be a buying opportunity.',
      takeaway: 'RSI alone isn\'t a buy/sell signal — but combined with price action, it\'s a powerful tool to confirm trade setups.',
    },
    {
      title: '🏦 Market Cap Explained',
      time: '2 min',
      brief: 'Market cap is the total value of a company\'s shares — Stock Price × Total Shares. It classifies companies as large-cap (stable), mid-cap (growth), or small-cap (high risk, high reward).',
      example: 'Reliance Industries with shares at ₹2,800 and 13.5 billion shares has a market cap of ~₹19 lakh crore — making it India\'s largest company.',
      takeaway: 'Large-caps offer stability. Small-caps offer growth. Your mix should match how much risk you can comfortably handle.',
    },
    {
      title: '🔁 Compounding — The 8th Wonder',
      time: '3 min',
      brief: 'Compounding means earning returns not just on your principal, but also on your previous returns. Over time, this creates exponential — not linear — wealth growth.',
      example: '₹1 lakh invested at 15% per year becomes ₹4 lakhs in 10 years — and ₹16 lakhs in 20 years. You didn\'t add any more money. Time did the work.',
      takeaway: 'Start investing early. Every year you delay is compounding working against you instead of for you.',
    },
    {
      title: '📐 Position Sizing',
      time: '2 min',
      brief: 'Position sizing is deciding how much of your capital to put into one trade. It ensures no single bet can cause serious damage to your overall portfolio.',
      example: 'If you have ₹1 lakh and invest ₹80,000 in one stock that crashes 40%, you\'re down ₹32,000. But if you only invested ₹10,000, you lost just ₹4,000.',
      takeaway: 'Risk a fixed percentage (like 2–5%) per trade — not your gut feeling. Consistency in sizing saves portfolios.',
    },
    {
      title: '🤑 Price-to-Earnings Ratio',
      time: '3 min',
      brief: 'P/E ratio compares a company\'s stock price to its earnings per share. A high P/E means investors expect strong future growth. A low P/E may signal undervaluation — or hidden problems.',
      example: 'Stock A earns ₹10 per share and trades at ₹200 — P/E of 20. Stock B earns ₹10 but trades at ₹500 — P/E of 50. Investors are paying a premium for B\'s growth story.',
      takeaway: 'P/E isn\'t a buy signal alone, but comparing a stock\'s P/E to its sector average quickly tells you if it\'s cheap or expensive.',
    },
    {
      title: '😰 Panic Selling Trap',
      time: '2 min',
      brief: 'Panic selling is dumping your investments during a market crash because fear takes over logic. It turns paper losses into real ones — and usually happens right before the market recovers.',
      example: 'Investors who panic-sold during the March 2020 COVID crash locked in 30–40% losses. Those who held or bought more saw 100%+ returns within 18 months.',
      takeaway: 'The best antidote to panic selling is a plan made before the crash — so emotions don\'t drive your decisions during it.',
    },
    {
      title: '📦 What is an ETF?',
      time: '2 min',
      brief: 'An ETF (Exchange Traded Fund) is a basket of stocks that trades like a single stock on the exchange. It offers instant diversification at low cost — ideal for beginners.',
      example: 'The NIFTY 50 ETF holds shares in all 50 NIFTY companies. Buying one unit gives you exposure to Reliance, TCS, HDFC, and 47 others — all in one click.',
      takeaway: 'ETFs are the most beginner-friendly way to invest — low fees, diversified exposure, and no stock-picking required.',
    },
    {
      title: '📆 Rupee Cost Averaging',
      time: '2 min',
      brief: 'Rupee Cost Averaging means investing the same fixed amount regularly — buying more units when prices are low and fewer when high. It naturally lowers your average cost over time.',
      example: 'You invest ₹5,000 every month. In month 1, units cost ₹100 — you buy 50. In month 2 they drop to ₹50 — you buy 100. Your average cost is now ₹66, lower than both prices.',
      takeaway: 'Market dips become opportunities when you invest regularly. RCA turns volatility into your friend, not your enemy.',
    },
    {
      title: '🎯 What is a Trend?',
      time: '2 min',
      brief: 'A trend is the general direction a stock or market is moving — uptrend (higher highs, higher lows), downtrend (lower highs, lower lows), or sideways. Trend analysis is the foundation of technical trading.',
      example: 'If a stock consistently makes new highs every few weeks, with each dip higher than the last, that\'s a healthy uptrend — a signal that buyers are in control.',
      takeaway: 'The trend is your friend — until it ends. Trading with the trend gives you the highest probability of success.',
    },
    {
      title: '🧠 Greed vs Discipline',
      time: '2 min',
      brief: 'Greed makes investors hold winning positions too long, hoping for more gains — only to watch profits evaporate. Discipline means taking profits at planned levels and sticking to your rules.',
      example: 'You buy at ₹100, plan to exit at ₹140. It hits ₹140 but you hold, hoping for ₹200. It falls back to ₹90. You just turned a 40% gain into a 10% loss.',
      takeaway: 'Set a profit target before you enter a trade. When it\'s hit, take it — regardless of what the market "might" do next.',
    },
    {
      title: '🔍 Fundamental vs Technical Analysis',
      time: '3 min',
      brief: 'Fundamental analysis looks at a company\'s financials — revenue, profit, debt — to find its true value. Technical analysis reads price charts and patterns to predict future movement. Most investors use both.',
      example: 'A fundamental analyst asks: "Is this company profitable and growing?" A technical analyst asks: "Is the chart showing a breakout pattern right now?" Both can lead to the same trade.',
      takeaway: 'Use fundamentals to pick WHAT to buy — and technicals to decide WHEN to buy it.',
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-bg-primary flex flex-col">
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border h-[60px] flex items-center justify-between px-4">
        <h1 className="text-xl font-heading font-bold text-text-primary">📚 Learning</h1>
        <div className="flex items-center space-x-1 text-accent-gold">
          <Flame size={16} fill="currentColor" />
          <span className="text-xs font-mono font-bold">{streakCount} Day Streak</span>
        </div>
      </header>

      <main className="flex-1 pt-[80px] pb-[90px] px-4 overflow-y-auto no-scrollbar">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-accent-gold/20 to-transparent border border-accent-gold/30 mb-8"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-mono font-bold text-accent-gold uppercase tracking-widest">TIER {user.currentTier} — Rising Investor 🚀</span>
            <span className="text-[10px] font-mono text-text-primary">{user.xpPoints} XP</span>
          </div>
          <div className="h-2 bg-bg-secondary rounded-full overflow-hidden mb-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (user.xpPoints / 500) * 100)}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-accent-gold shadow-[0_0_10px_#F0A500]"
            />
          </div>
          <p className="text-[11px] text-text-muted">Keep learning to increase your Tier level</p>
        </motion.div>

        <div className="space-y-2">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ModuleCard {...module} />
            </motion.div>
          ))}
        </div>

        <div className="mt-10 mb-4">
          <div className="mb-4">
            <h2 className="text-lg font-heading font-bold text-text-primary">Quick Concepts</h2>
            <p className="text-xs text-text-muted">2-minute reads</p>
          </div>
          
          <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
            {quickConcepts.map((concept, i) => (
              <motion.div
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveConcept(concept)}
                className="flex-shrink-0 w-[160px] h-[120px] bg-bg-card border border-border rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-text-primary leading-tight">{concept.title}</h4>
                  <span className="text-[10px] text-text-muted mt-1 block">{concept.time}</span>
                </div>
                <div className="flex justify-end">
                  <div className="w-6 h-6 rounded-full bg-bg-secondary flex items-center justify-center">
                    <ArrowRight size={12} className="text-accent-gold" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-bg-card border border-border px-6 py-3 rounded-full shadow-2xl"
          >
            <span className="text-sm font-bold text-text-primary">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeConcept && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/70 flex items-end justify-center p-4 pb-6"
            onClick={() => setActiveConcept(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[390px] bg-bg-card border border-border rounded-3xl p-5 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-base font-heading font-bold text-text-primary pr-4 leading-snug">{activeConcept.title}</h3>
                <button onClick={() => setActiveConcept(null)} className="text-text-muted mt-0.5 flex-shrink-0">
                  <X size={18} />
                </button>
              </div>
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-4">{activeConcept.time} read</p>

              {/* Brief */}
              <p className="text-sm text-text-primary leading-relaxed mb-4">{activeConcept.brief}</p>

              {/* Divider */}
              <div className="h-px bg-border mb-4" />

              {/* Example */}
              <div className="bg-bg-secondary/60 rounded-2xl px-4 py-3 mb-3">
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <Lightbulb size={12} className="text-accent-gold" />
                  <span className="text-[10px] font-mono font-bold text-accent-gold uppercase tracking-widest">Example</span>
                </div>
                <p className="text-xs text-text-primary leading-relaxed">{activeConcept.example}</p>
              </div>

              {/* Takeaway */}
              <div className="bg-accent-gold/[0.06] border border-accent-gold/20 rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <Target size={12} className="text-accent-gold" />
                  <span className="text-[10px] font-mono font-bold text-accent-gold uppercase tracking-widest">Takeaway</span>
                </div>
                <p className="text-xs text-text-primary font-medium leading-relaxed">{activeConcept.takeaway}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}