import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Pages
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Learn from './pages/Learn';
import LessonOrQuizPage from './pages/LessonOrQuizPage';
import Trade from './pages/Trade';
import StockDetail from './pages/StockDetail';
import TimeMachine from './pages/TimeMachine';
import Portfolio from './pages/Portfolio';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import LossDebrief from './pages/LossDebrief';

// Components
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import MarketTicker from './components/MarketTicker';
import XPToast from './components/XPToast';

function AnimatedRoutes() {
  const location = useLocation();
  
  // Routes that should show the global BottomNav
  const mainTabs = ['/home', '/learn', '/trade', '/loss-simulator', '/portfolio', '/profile'];
  const isMainTab = mainTabs.includes(location.pathname);
  
  // Routes that should show the global TopBar and MarketTicker
  // For now, we'll keep this false for main tabs as they have custom headers
  const showGlobalTopNav = false; 

  return (
    <div className="app-container">
      {showGlobalTopNav && <TopBar />}
      <main className={`content-area ${!showGlobalTopNav && !isMainTab ? 'pt-0 pb-0' : ''}`}>
        {showGlobalTopNav && <MarketTicker />}
        <AnimatePresence mode="wait">
          {/* @ts-ignore - Routes component accepts key for AnimatePresence transitions */}
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Splash /></PageWrapper>} />
            <Route path="/onboarding" element={<PageWrapper><Onboarding /></PageWrapper>} />
            <Route path="/home" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/learn" element={<PageWrapper><Learn /></PageWrapper>} />
            <Route path="/learn/:moduleId" element={<PageWrapper><LessonOrQuizPage /></PageWrapper>} />
            <Route path="/learn/:moduleId/:lessonId" element={<PageWrapper><LessonOrQuizPage /></PageWrapper>} />
            <Route path="/trade" element={<PageWrapper><Trade /></PageWrapper>} />
            <Route path="/trade/:symbol" element={<PageWrapper><StockDetail /></PageWrapper>} />
            <Route path="/loss-simulator" element={<PageWrapper><TimeMachine /></PageWrapper>} />
            <Route path="/time-machine" element={<Navigate to="/loss-simulator" replace />} />
            <Route path="/portfolio" element={<PageWrapper><Portfolio /></PageWrapper>} />
            <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
            <Route path="/loss-debrief" element={<PageWrapper><LossDebrief /></PageWrapper>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      {isMainTab && <BottomNav />}
    </div>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
      <XPToast />
    </BrowserRouter>
  );
}
