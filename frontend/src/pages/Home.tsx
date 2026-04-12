import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  CheckCircle2, 
  Lock, 
  RefreshCw,
  Home as HomeIcon,
  BookOpen,
  BarChart2,
  History,
  User,
  ChevronRight
} from 'lucide-react';
import { MOCK_USER, MOCK_MARKET } from '../constants';

export default function Home() {
  const navigate = useNavigate();
  
  // Portfolio Count-up
  const count = useMotionValue(100000);
  const rounded = useTransform(count, (latest) => 
    Math.round(latest).toLocaleString('en-IN')
  );

  useEffect(() => {
    const controls = animate(count, 114230, { duration: 2, ease: "easeOut" });
    return () => controls.stop();
  }, []);

  // Sparkline Points
  const sparkPoints = [100000, 102000, 101200, 105000, 108000, 111000, 114230];
  const min = 100000;
  const max = 114230;
  const range = max - min;
  const width = 350;
  const height = 48;
  
  const pathData = sparkPoints.map((val, i) => {
    const x = (i / (sparkPoints.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative min-h-screen w-full bg-bg-primary bg-dots flex flex-col">
      {/* TOP BAR */}
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border">
        <div className="h-[60px] flex items-center justify-between px-4">
          <span className="font-heading font-bold text-base">Good morning, Arjun 👋</span>
          <div className="px-3 py-1 rounded-full bg-accent-gold/15 border border-accent-gold/20">
            <span className="text-[10px] font-bold text-accent-gold uppercase tracking-wider">📄 Paper Mode</span>
          </div>
        </div>
        {/* Ticker Bar */}
        <div className="h-[30px] bg-bg-secondary border-t border-border overflow-hidden flex items-center">
          <div className="flex animate-ticker whitespace-nowrap">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center space-x-6 px-4">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-text-muted">NIFTY</span>
                  <span className="text-[11px] font-mono font-bold">22,347</span>
                  <span className="text-[11px] font-mono font-bold text-accent-green">▲0.42%</span>
                </div>
                <span className="text-border">|</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-text-muted">SENSEX</span>
                  <span className="text-[11px] font-mono font-bold">73,847</span>
                  <span className="text-[11px] font-mono font-bold text-accent-green">▲0.38%</span>
                </div>
                <span className="text-border">|</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 pt-[100px] pb-[80px] px-4 overflow-y-auto no-scrollbar">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* SECTION 1: Portfolio Hero Card */}
          <motion.div 
            variants={itemVariants}
            className="relative p-6 rounded-2xl bg-bg-card border border-accent-gold/30 overflow-hidden"
            style={{
              borderImage: 'linear-gradient(to bottom right, #F0A500, transparent) 1'
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[12px] font-mono text-text-muted uppercase tracking-wider">Total Portfolio</span>
              <div className="px-2 py-0.5 rounded bg-accent-gold/10 border border-accent-gold/20">
                <span className="text-[10px] font-bold text-accent-gold">TIER 2 🚀</span>
              </div>
            </div>

            <div className="flex items-baseline space-x-1 mb-1">
              <span className="text-2xl font-heading font-bold text-text-primary">₹</span>
              <motion.span className="text-[44px] font-heading font-bold text-text-primary leading-none">
                {rounded}
              </motion.span>
            </div>

            <div className="flex items-center space-x-2 mb-6">
              <span className="text-sm font-mono font-bold text-accent-green">+₹14,230 (+14.2%) ▲</span>
              <span className="text-[11px] text-text-muted">All time returns</span>
            </div>

            <div className="h-[1px] bg-border mb-4" />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[18px] font-mono font-bold text-text-primary">₹37,450</p>
                <p className="text-[11px] text-text-muted uppercase tracking-tight">Cash Available</p>
              </div>
              <div className="text-right">
                <p className="text-[18px] font-mono font-bold text-text-primary">12 Days</p>
                <p className="text-[11px] text-text-muted uppercase tracking-tight">Active Streak 🔥</p>
              </div>
            </div>

            {/* Sparkline */}
            <div className="relative h-12 w-full mt-2">
              <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <motion.path
                  d={pathData}
                  fill="none"
                  stroke="#00D4A1"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </svg>
            </div>
          </motion.div>

          {/* SECTION 2: Today's Snapshot */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
            <div className="bg-bg-card border border-border p-3 rounded-xl">
              <span className="text-[10px] text-text-muted uppercase block mb-1">📈 Best</span>
              <p className="text-[11px] font-mono font-bold text-text-primary truncate">TATAMOTORS</p>
              <p className="text-xs font-mono font-bold text-accent-green">+12.7%</p>
            </div>
            <div className="bg-bg-card border border-border p-3 rounded-xl">
              <span className="text-[10px] text-text-muted uppercase block mb-1">Watch</span>
              <p className="text-[11px] font-mono font-bold text-text-primary truncate">YESBANK</p>
              <p className="text-xs font-mono font-bold text-accent-red">-33.3%</p>
            </div>
            <div className="bg-bg-card border border-border p-3 rounded-xl">
              <span className="text-[10px] text-text-muted uppercase block mb-1">🛡️ Risk</span>
              <p className="text-[12px] font-heading font-bold text-accent-gold">7.4/10</p>
              <p className="text-[10px] text-text-muted">Balanced</p>
            </div>
          </motion.div>

          {/* SECTION 3: Loss Alert Banner */}
          <motion.div 
            variants={itemVariants}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/loss-debrief')}
            className="flex items-center p-4 rounded-xl bg-accent-red/10 border border-accent-red animate-pulse-red cursor-pointer"
          >
            <span className="text-3xl mr-4">💥</span>
            <div className="flex-1">
              <h3 className="text-sm font-heading font-bold text-accent-red">Portfolio Alert</h3>
              <p className="text-[12px] text-text-primary leading-tight">Yes Bank dropped ₹1,200 today. Tap to understand why.</p>
            </div>
            <ChevronRight size={20} className="text-accent-red" />
          </motion.div>

          {/* SECTION 4: Active Missions */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-lg font-heading font-bold text-text-primary">🎯 Missions</h2>
                <div className="w-48 h-1.5 bg-bg-secondary rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '68%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-accent-gold"
                  />
                </div>
              </div>
              <button onClick={() => navigate('/profile')} className="text-xs font-bold text-accent-gold uppercase tracking-wider">
                340/500 XP →
              </button>
            </div>

            <div className="space-y-3">
              {/* Mission 1 */}
              <div className="flex items-center p-4 rounded-xl bg-bg-card border border-border opacity-80">
                <div className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center mr-4">
                  <CheckCircle2 size={18} className="text-accent-green" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-primary line-through decoration-text-muted">Buy your first Large Cap stock</p>
                </div>
                <div className="px-2 py-0.5 rounded bg-accent-green/10 border border-accent-green/20">
                  <span className="text-[10px] font-bold text-accent-green">+50 XP</span>
                </div>
              </div>

              {/* Mission 2 */}
              <div className="flex items-center p-4 rounded-xl bg-bg-card border border-border">
                <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center mr-4">
                  <RefreshCw size={18} className="text-accent-gold animate-spin-slow" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-primary">Hold a stock for 3 days</p>
                  <div className="w-24 h-1 bg-bg-secondary rounded-full mt-1.5">
                    <div className="h-full w-2/3 bg-accent-gold rounded-full" />
                  </div>
                  <p className="text-[10px] text-text-muted mt-1">2 of 3 days</p>
                </div>
                <div className="px-2 py-0.5 rounded bg-accent-gold/10 border border-accent-gold/20">
                  <span className="text-[10px] font-bold text-accent-gold">+75 XP</span>
                </div>
              </div>

              {/* Mission 3 */}
              <div className="flex items-center p-4 rounded-xl bg-bg-card border border-border opacity-50">
                <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center mr-4">
                  <Lock size={18} className="text-text-muted" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-primary">Build a 5-stock portfolio</p>
                  <p className="text-[10px] text-text-muted">Unlock at Tier 3</p>
                </div>
                <div className="px-2 py-0.5 rounded bg-bg-secondary border border-border">
                  <span className="text-[10px] font-bold text-text-muted">+100 XP</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* SECTION 5: Recent Activity */}
          <motion.div variants={itemVariants} className="space-y-4 pb-4">
            <h2 className="text-lg font-heading font-bold text-text-primary">Recent Activity</h2>
            <div className="relative pl-6 space-y-6">
              <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-accent-gold/30" />
              
              <div className="relative">
                <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent-green ring-4 ring-bg-primary" />
                <p className="text-[13px] font-mono text-text-primary">Bought 5 TCS at ₹3,421</p>
                <p className="text-[11px] text-text-muted">2 hours ago</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent-red ring-4 ring-bg-primary" />
                <p className="text-[13px] font-mono text-text-primary">Sold 10 ZOMATO at ₹182</p>
                <p className="text-[11px] text-text-muted">Yesterday</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent-gold ring-4 ring-bg-primary" />
                <p className="text-[13px] font-mono text-text-primary">Completed: What is a Stop Loss?</p>
                <p className="text-[11px] text-text-muted">Yesterday</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent-green ring-4 ring-bg-primary" />
                <p className="text-[13px] font-mono text-text-primary">Bought 2 RELIANCE at ₹2,847</p>
                <p className="text-[11px] text-text-muted">2 days ago</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent-red ring-4 ring-bg-primary" />
                <p className="text-[13px] font-mono text-text-primary">Loss Debrief saved: Yes Bank</p>
                <p className="text-[11px] text-text-muted">3 days ago</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
