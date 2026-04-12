import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HomeIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const LearnIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M8 7h6" />
    <path d="M8 11h8" />
    <path d="M8 15h6" />
  </svg>
);

const TradeIcon = ({ color }: { color: string }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2v20" />
    <path d="M18 2v20" />
    <path d="M3 8h6" />
    <path d="M3 16h6" />
    <path d="M15 6h6" />
    <path d="M15 14h6" />
  </svg>
);

const HistoryIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="m12 7 0 5 3 3" />
  </svg>
);

const ProfileIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'home', label: 'Home', path: '/home', icon: HomeIcon },
    { id: 'learn', label: 'Learn', path: '/learn', icon: LearnIcon },
    { id: 'trade', label: 'Trade', path: '/trade', icon: TradeIcon, isCenter: true },
    { id: 'history', label: 'History', path: '/time-machine', icon: HistoryIcon },
    { id: 'profile', label: 'Profile', path: '/profile', icon: ProfileIcon },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 max-w-[390px] mx-auto bg-[#111118] border-t border-[#2A2A3E] z-50 flex items-end justify-around px-2"
      style={{ 
        height: '70px',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const color = isActive ? '#F0A500' : '#6B6B8A';

        if (item.isCenter) {
          return (
            <div key={item.id} className="relative flex flex-col items-center mb-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(item.path)}
                className={`w-[52px] h-[52px] rounded-full bg-[#F0A500] flex items-center justify-center -translate-y-3 shadow-lg transition-shadow duration-300 ${
                  isActive ? 'shadow-[0_0_20px_rgba(240,165,0,0.5)]' : ''
                }`}
              >
                <item.icon color="black" />
              </motion.button>
              <span 
                className="text-[10px] font-mono font-bold uppercase tracking-wider -mt-2"
                style={{ color: '#F0A500' }}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="w-1 h-1 bg-[#F0A500] rounded-full mt-1"
                />
              )}
            </div>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center h-full pb-2 relative group"
          >
            <motion.div
              whileTap={{ scale: 1.2 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <item.icon color={color} />
            </motion.div>
            <span 
              className="text-[10px] font-mono font-bold uppercase tracking-wider mt-1 transition-colors duration-200"
              style={{ color }}
            >
              {item.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="w-1 h-1 bg-[#F0A500] rounded-full mt-1"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
