import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Trophy, 
  BookOpen, 
  ShieldCheck, 
  TrendingUp, 
  Share2, 
  ChevronLeft,
  Copy,
  X,
  Home as HomeIcon,
  BarChart2,
  History,
  User,
  BookOpen as BookIcon
} from 'lucide-react';

// --- MOCK DATA ---
const LEADERBOARD_DATA = {
  returns: [
    { rank: 1, name: 'Priya S.', value: '+31.4%', sub: '₹1,31,400', initial: 'PS' },
    { rank: 2, name: 'Rahul M.', value: '+28.7%', sub: '₹1,28,700', initial: 'RM' },
    { rank: 3, name: 'Kavya T.', value: '+22.1%', sub: '₹1,22,100', initial: 'KT' },
    { rank: 4, name: 'Arjun K.', value: '+14.2%', sub: '₹1,14,200', initial: 'AK', isUser: true },
    { rank: 5, name: 'Sneha R.', value: '+12.8%', sub: '₹1,12,800', initial: 'SR' },
    { rank: 6, name: 'Vikram M.', value: '+11.4%', sub: '₹1,11,400', initial: 'VM' },
    { rank: 7, name: 'Pooja S.', value: '+9.7%', sub: '₹1,09,700', initial: 'PS' },
    { rank: 8, name: 'Amit R.', value: '+8.2%', sub: '₹1,08,200', initial: 'AR' },
    { rank: 9, name: 'Divya K.', value: '+7.1%', sub: '₹1,07,100', initial: 'DK' },
    { rank: 10, name: 'Rohan S.', value: '+5.9%', sub: '₹1,05,900', initial: 'RS' },
  ],
  learning: [
    { rank: 1, name: 'Kavya T.', value: '15/15', sub: '500 XP', initial: 'KT' },
    { rank: 2, name: 'Priya S.', value: '14/15', sub: '475 XP', initial: 'PS' },
    { rank: 3, name: 'Sneha R.', value: '12/15', sub: '410 XP', initial: 'SR' },
    { rank: 4, name: 'Arjun K.', value: '8/15', sub: '340 XP', initial: 'AK', isUser: true },
    { rank: 5, name: 'Rahul M.', value: '7/15', sub: '310 XP', initial: 'RM' },
  ],
  risk: [
    { rank: 1, name: 'Priya S.', value: '9.2/10', sub: 'Exceptional', initial: 'PS' },
    { rank: 2, name: 'Kavya T.', value: '8.7/10', sub: 'Excellent', initial: 'KT' },
    { rank: 3, name: 'Arjun K.', value: '7.4/10', sub: 'Balanced', initial: 'AK', isUser: true },
    { rank: 4, name: 'Vikram M.', value: '6.8/10', sub: 'Moderate', initial: 'VM' },
    { rank: 5, name: 'Sneha R.', value: '6.2/10', sub: 'Moderate', initial: 'SR' },
  ]
};

const BADGES = [
  { id: 1, emoji: '🎯', name: 'First Trade', sub: 'Completed', earned: true },
  { id: 2, emoji: '📚', name: 'Scholar', sub: '5 lessons done', earned: true },
  { id: 3, emoji: '💰', name: 'Profit Maker', sub: '10%+ returns', earned: true },
  { id: 4, emoji: '🛡️', name: 'Risk Manager', sub: 'Diversify your portfolio', earned: false },
  { id: 5, emoji: '⏪', name: 'Time Traveler', sub: 'Complete all scenarios', earned: false },
  { id: 6, emoji: '🏆', name: 'Top 10', sub: 'Reach leaderboard top 10', earned: false },
];

export default function Profile() {
  const USER_NAME_STORAGE_KEY = 'investsim_user_name';
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'returns' | 'learning' | 'risk'>('returns');
  const [showShare, setShowShare] = useState(false);
  const displayName = localStorage.getItem(USER_NAME_STORAGE_KEY)?.trim() || 'Investor';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'IN';
  const leaderboardForTab = LEADERBOARD_DATA[activeTab].map((entry) =>
    entry.isUser ? { ...entry, name: displayName, initial: initials } : entry
  );

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
            <p className="text-xs text-text-muted mb-6">Member since March 2025</p>
            
            <div className="w-full p-4 rounded-2xl border border-accent-gold/30 bg-bg-secondary/50 backdrop-blur-sm">
              <div className="text-sm font-heading font-bold text-accent-gold mb-3 tracking-wide">
                🚀 TIER 2 — RISING INVESTOR
              </div>
              <div className="h-2 bg-bg-primary rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '68%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-accent-gold shadow-[0_0_10px_#F0A500]"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-text-muted">340 / 500 XP to Tier 3</span>
                <span className="text-[10px] text-text-muted font-bold">160 XP to Full Sandbox 🎯</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SECTION 2: STATS GRID */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {[
            { label: 'Total Return', value: '+14.2%', color: 'text-accent-green', sub: 'Total Return' },
            { label: 'Best Trade', value: 'TATAMOTORS', color: 'text-accent-green', sub: '+12.7% 🏆', isSmall: true },
            { label: 'Worst Trade', value: 'YESBANK', color: 'text-accent-red', sub: '-33.3% 📉', isSmall: true },
            { label: 'Lessons Done', value: '8 / 15', color: 'text-accent-gold', sub: 'Lessons Done' },
            { label: 'Time Machine', value: '225 XP', color: 'text-accent-gold', sub: 'History Score' },
            { label: 'Active Days', value: '12', color: 'text-text-primary', sub: 'Day Streak 🔥' },
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

        {/* SECTION 3: BADGES */}
        <div className="mb-10">
          <h3 className="text-lg font-heading font-bold mb-4 flex items-center">
            <span className="mr-2">🏅</span> Badges Earned
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {BADGES.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${
                  badge.earned 
                    ? 'bg-bg-card border-accent-gold/30 shadow-[0_0_15px_rgba(240,165,0,0.05)]' 
                    : 'bg-bg-secondary border-border opacity-60 grayscale'
                }`}
              >
                <div className="relative">
                  <span className="text-4xl mb-2 block">{badge.emoji}</span>
                  {!badge.earned && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-bg-primary rounded-full flex items-center justify-center border border-border">
                      <X size={10} className="text-text-muted" />
                    </div>
                  )}
                  {badge.earned && (
                    <motion.div 
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-accent-gold blur-xl rounded-full -z-10"
                    />
                  )}
                </div>
                <span className={`text-xs font-bold mt-2 ${badge.earned ? 'text-text-primary' : 'text-text-muted'}`}>
                  {badge.name}
                </span>
                <span className="text-[9px] text-text-muted mt-1 leading-tight">
                  {badge.sub}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SECTION 4: LEADERBOARD */}
        <div className="mb-8">
          <h3 className="text-xl font-heading font-bold mb-4 flex items-center">
            <span className="mr-2">🏆</span> Leaderboard
          </h3>
          
          <div className="flex bg-bg-card rounded-xl p-1 mb-4 border border-border">
            {(['returns', 'learning', 'risk'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab 
                    ? 'bg-accent-gold text-black shadow-lg' 
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tab === 'returns' ? '📈 Returns' : tab === 'learning' ? '📚 Learning' : '🛡️ Risk Score'}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-text-muted mb-6 px-1">
            {activeTab === 'returns' && "Based on total portfolio returns since start"}
            {activeTab === 'learning' && "Ranked by lessons completed + XP earned"}
            {activeTab === 'risk' && "Ranked by returns ÷ max loss (higher = smarter risk)"}
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {/* PODIUM */}
              <div className="flex items-end justify-center space-x-2 mb-8 px-2">
                {/* #2 */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-bg-card border-2 border-slate-400 flex items-center justify-center mb-2 relative">
                    <span className="text-sm font-bold">{leaderboardForTab[1].initial}</span>
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-slate-400 rounded-full flex items-center justify-center text-[10px] font-bold text-black">2</div>
                  </div>
                  <div className="w-full h-16 bg-bg-card border-t-2 border-slate-400 rounded-t-lg flex flex-col items-center justify-center p-1">
                    <span className="text-[10px] font-bold truncate w-full text-center">{leaderboardForTab[1].name}</span>
                    <span className="text-[10px] text-accent-green">{leaderboardForTab[1].value}</span>
                  </div>
                </div>

                {/* #1 */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-bg-card border-2 border-accent-gold flex items-center justify-center mb-2 relative shadow-[0_0_20px_rgba(240,165,0,0.2)]">
                    <span className="text-lg font-bold">{leaderboardForTab[0].initial}</span>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent-gold rounded-full flex items-center justify-center text-xs font-bold text-black">1</div>
                  </div>
                  <div className="w-full h-24 bg-bg-card border-t-2 border-accent-gold rounded-t-lg flex flex-col items-center justify-center p-1 shadow-[0_-5px_15px_rgba(240,165,0,0.1)]">
                    <span className="text-xs font-bold truncate w-full text-center">{leaderboardForTab[0].name}</span>
                    <span className="text-xs text-accent-gold font-bold">{leaderboardForTab[0].value}</span>
                  </div>
                </div>

                {/* #3 */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-bg-card border-2 border-amber-700 flex items-center justify-center mb-2 relative">
                    <span className="text-sm font-bold">{leaderboardForTab[2].initial}</span>
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-700 rounded-full flex items-center justify-center text-[10px] font-bold text-black">3</div>
                  </div>
                  <div className="w-full h-12 bg-bg-card border-t-2 border-amber-700 rounded-t-lg flex flex-col items-center justify-center p-1">
                    <span className="text-[10px] font-bold truncate w-full text-center">{leaderboardForTab[2].name}</span>
                    <span className="text-[10px] text-accent-green">{leaderboardForTab[2].value}</span>
                  </div>
                </div>
              </div>

              {/* LIST */}
              <div className="space-y-2">
                {leaderboardForTab.slice(3).map((item) => (
                  <div 
                    key={item.rank}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      item.isUser 
                        ? 'bg-accent-gold/10 border-accent-gold border-l-4' 
                        : 'bg-bg-secondary border-border'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-text-muted w-4">#{item.rank}</span>
                      <div className="w-8 h-8 rounded-full bg-bg-card border border-border flex items-center justify-center text-[10px] font-bold">
                        {item.initial}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{item.name}</p>
                        <p className="text-[9px] text-text-muted">{item.sub}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${item.isUser ? 'text-accent-gold' : 'text-text-primary'}`}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 p-4 rounded-xl bg-accent-gold text-black flex justify-between items-center font-bold">
            <span className="text-xs uppercase tracking-wider">Your Rank</span>
            <span className="text-lg">#4 of 1,247</span>
          </div>
        </div>

        {/* SHARE BUTTON */}
        <button 
          onClick={() => setShowShare(true)}
          className="w-full py-4 rounded-2xl border-2 border-accent-gold text-accent-gold font-heading font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
        >
          <Share2 size={18} />
          <span>Share My Performance</span>
        </button>
      </main>

      {/* SHARE MODAL */}
      <AnimatePresence>
        {showShare && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShare(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[320px] bg-bg-primary border border-border rounded-[32px] overflow-hidden shadow-2xl"
            >
              {/* Story Content */}
              <div className="aspect-[9/16] bg-gradient-to-b from-bg-card to-bg-primary p-8 flex flex-col items-center justify-between text-center relative">
                <div className="absolute top-0 left-0 w-full h-full bg-dots opacity-10" />
                
                <div className="z-10">
                  <div className="w-16 h-16 rounded-full bg-accent-gold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-gold/20">
                    <span className="text-xl font-heading font-extrabold text-black">{initials}</span>
                  </div>
                  <h3 className="text-xl font-heading font-bold text-text-primary mb-1">{displayName}</h3>
                  <p className="text-[10px] text-accent-gold font-bold uppercase tracking-widest">Rising Investor</p>
                </div>

                <div className="z-10 py-10">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <span className="text-6xl font-heading font-extrabold text-accent-green block mb-2">+14.2%</span>
                    <p className="text-sm text-text-muted">I made +14.2% on InvestSim!</p>
                    <p className="text-[10px] text-accent-gold mt-2 font-bold">#PaperTrading #InvestSim</p>
                  </motion.div>
                </div>

                <div className="z-10 w-full">
                  <div className="p-4 rounded-2xl border border-border bg-bg-secondary/50 backdrop-blur-md">
                    <div className="flex justify-around items-center">
                      <div className="text-center">
                        <p className="text-[10px] text-text-muted uppercase mb-1">Rank</p>
                        <p className="text-lg font-bold text-accent-gold">#4</p>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="text-center">
                        <p className="text-[10px] text-text-muted uppercase mb-1">XP</p>
                        <p className="text-lg font-bold text-accent-gold">340</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-bg-secondary border-t border-border flex space-x-3">
                <button className="flex-1 py-3 rounded-xl bg-accent-gold text-black font-bold text-sm flex items-center justify-center space-x-2">
                  <Copy size={16} />
                  <span>Copy Link</span>
                </button>
                <button 
                  onClick={() => setShowShare(false)}
                  className="w-12 h-12 rounded-xl border border-border flex items-center justify-center text-text-muted"
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
