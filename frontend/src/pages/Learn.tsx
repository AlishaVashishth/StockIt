import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle2, 
  Lock, 
  History, 
  Home as HomeIcon, 
  BarChart2, 
  User,
  ArrowRight,
  Flame,
  ChevronRight,
  PlayCircle
} from 'lucide-react';

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
      {/* Top Row */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{number}</span>
        <div className={`px-2 py-0.5 rounded flex items-center space-x-1 ${
          status === 'COMPLETED' ? 'bg-accent-green/10 text-accent-green' :
          status === 'IN_PROGRESS' ? 'bg-accent-gold/10 text-accent-gold' :
          'bg-bg-secondary text-text-muted'
        }`}>
          {status === 'COMPLETED' && <CheckCircle2 size={10} />}
          {isLocked && <Lock size={10} />}
          <span className="text-[9px] font-bold uppercase tracking-wider">
            {status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Content */}
      <h3 className={`text-xl font-heading font-bold mb-1 ${isLocked ? 'text-text-muted' : 'text-text-primary'}`}>
        {title}
      </h3>
      <p className="text-xs text-text-muted mb-4 leading-relaxed">
        {description}
      </p>

      {/* Case Study Tag */}
      <div className="bg-bg-secondary/50 rounded-lg px-3 py-2 mb-4 inline-block">
        <span className="text-[10px] font-mono text-text-primary">{caseStudy}</span>
      </div>

      {/* Progress Section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex-1 h-1.5 bg-bg-secondary rounded-full mr-4 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full rounded-full ${
                status === 'COMPLETED' ? 'bg-accent-green' : 'bg-accent-gold'
              }`}
            />
          </div>
          <span className="text-[10px] font-mono text-text-muted whitespace-nowrap">{lessons}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className={`text-[10px] font-bold ${
            status === 'COMPLETED' ? 'text-accent-green' : 'text-text-muted'
          }`}>
            {status === 'COMPLETED' ? 'EARNED' : 'REWARD'}: {xp}
          </span>
          {isLocked && (
            <span className="text-[9px] text-accent-red font-bold uppercase tracking-tighter">
              {status === 'LOCKED_TIER' ? 'Reach Tier 3 to unlock' : 'Complete Module 3 to unlock'}
            </span>
          )}
        </div>
      </div>

      {/* CTA Button for In Progress */}
      {status === 'IN_PROGRESS' && (
        <button className="w-full mt-5 bg-accent-gold text-bg-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2">
          <span>Continue Learning</span>
          <ArrowRight size={16} />
        </button>
      )}

      {/* CTA Button for Not Started */}
      {status === 'NOT_STARTED' && (
        <button className="w-full mt-5 border border-accent-gold text-accent-gold py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 bg-transparent">
          <span>Start Module</span>
          <PlayCircle size={16} />
        </button>
      )}

      {/* Locked Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-bg-primary/20 pointer-events-none" />
      )}
    </motion.div>
  );
}

export default function Learn() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleModuleTap = (id: number, status: string) => {
    if (status.startsWith('LOCKED')) {
      showToast("🔒 Complete previous module first");
      return;
    }
    navigate(`/learn/${id}`);
  };

  const modules: ModuleCardProps[] = [
    {
      id: 1,
      number: 'MODULE 01',
      status: 'COMPLETED',
      title: 'What is a Stock?',
      description: 'Ownership, shares, and why companies list publicly',
      caseStudy: '📊 Case Study: Reliance 1977 IPO',
      progress: 100,
      lessons: '5/5 lessons',
      xp: '+50 XP',
      onTap: handleModuleTap
    },
    {
      id: 2,
      number: 'MODULE 02',
      status: 'IN_PROGRESS',
      title: 'Reading the Market',
      description: 'Candlesticks, charts, volume, and what they reveal',
      caseStudy: '📊 Case Study: NIFTY COVID Crash 2020',
      progress: 60,
      lessons: '3/5 lessons',
      xp: '+75 XP',
      isProminent: true,
      onTap: handleModuleTap
    },
    {
      id: 3,
      number: 'MODULE 03',
      status: 'NOT_STARTED',
      title: 'Understanding Risk',
      description: 'Concentration, regulatory, market risk — with real stories',
      caseStudy: '📊 Case Study: Yes Bank Collapse 2020',
      progress: 0,
      lessons: '0/5 lessons',
      xp: '+100 XP',
      onTap: handleModuleTap
    },
    {
      id: 4,
      number: 'MODULE 04',
      status: 'LOCKED',
      title: 'Portfolio & Diversification',
      description: 'Why spreading risk is armour, not just advice',
      caseStudy: '📊 Case Study: 2008 Financial Crisis',
      progress: 0,
      lessons: '0/5 lessons',
      xp: '+125 XP',
      onTap: handleModuleTap
    },
    {
      id: 5,
      number: 'MODULE 05',
      status: 'LOCKED_TIER',
      title: 'Advanced Trading & F&O Basics',
      description: 'Stop losses, options, futures — the full toolkit',
      caseStudy: '📊 Case Study: GameStop Short Squeeze',
      progress: 0,
      lessons: '0/5 lessons',
      xp: '+150 XP',
      onTap: handleModuleTap
    }
  ];

  const quickConcepts = [
    { title: '🐂 Bull vs Bear Market', time: '2 min' },
    { title: '📊 What is NIFTY 50?', time: '2 min' },
    { title: '💰 What is a Dividend?', time: '3 min' },
    { title: '🛑 Stop Loss Explained', time: '2 min' },
    { title: '📈 What is SIP?', time: '3 min' },
  ];

  return (
    <div className="relative min-h-screen w-full bg-bg-primary flex flex-col">
      {/* TOP BAR */}
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border h-[60px] flex items-center justify-between px-4">
        <h1 className="text-xl font-heading font-bold text-text-primary">📚 Learning</h1>
        <div className="flex items-center space-x-1 text-accent-gold">
          <Flame size={16} fill="currentColor" />
          <span className="text-xs font-mono font-bold">4 Day Streak</span>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 pt-[80px] pb-[90px] px-4 overflow-y-auto no-scrollbar">
        {/* SECTION 1: XP Progress Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-accent-gold/20 to-transparent border border-accent-gold/30 mb-8"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-mono font-bold text-accent-gold uppercase tracking-widest">TIER 2 — Rising Investor 🚀</span>
            <span className="text-[10px] font-mono text-text-primary">340 / 500 XP</span>
          </div>
          <div className="h-2 bg-bg-secondary rounded-full overflow-hidden mb-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '68%' }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-accent-gold shadow-[0_0_10px_#F0A500]"
            />
          </div>
          <p className="text-[11px] text-text-muted">160 XP to Tier 3 — Full Sandbox</p>
        </motion.div>

        {/* SECTION 2: Module Cards */}
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

        {/* SECTION 3: Quick Concepts */}
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

      {/* TOAST NOTIFICATION */}
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
    </div>
  );
}
