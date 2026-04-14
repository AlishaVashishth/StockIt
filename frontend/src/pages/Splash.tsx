import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const existingEmail = localStorage.getItem('investsim_user_email');
      if (existingEmail) {
        navigate('/home');
      } else {
        navigate('/onboarding');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative h-screen w-full bg-bg-primary overflow-hidden flex flex-col items-center justify-center">
      {/* Background Patterns */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="noise-overlay" />
      
      {/* Halo Glow */}
      <div 
        className="absolute w-[300px] h-[300px] rounded-full blur-[100px]"
        style={{ 
          background: 'radial-gradient(circle, rgba(240, 165, 0, 0.08) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Mark: Candlestick Chart */}
        <div className="w-16 h-16 mb-6 flex items-end justify-center space-x-2">
          {/* Candle 1 */}
          <div className="flex flex-col items-center">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 8 }}
              transition={{ delay: 0, duration: 0.3 }}
              className="w-[2px] bg-accent-green"
            />
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 24 }}
              transition={{ delay: 0, duration: 0.6, ease: "easeOut" }}
              className="w-3 bg-accent-green rounded-sm"
            />
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 6 }}
              transition={{ delay: 0, duration: 0.3 }}
              className="w-[2px] bg-accent-green"
            />
          </div>

          {/* Candle 2 (Middle, Tallest) */}
          <div className="flex flex-col items-center">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 12 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="w-[2px] bg-accent-red"
            />
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 40 }}
              transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
              className="w-3 bg-accent-red rounded-sm"
            />
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 10 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="w-[2px] bg-accent-red"
            />
          </div>

          {/* Candle 3 */}
          <div className="flex flex-col items-center">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 6 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="w-[2px] bg-accent-green"
            />
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 20 }}
              transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
              className="w-3 bg-accent-green rounded-sm"
            />
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 8 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="w-[2px] bg-accent-green"
            />
          </div>
        </div>

        {/* App Name */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="text-[36px] font-heading font-bold text-text-primary tracking-[0.05em]"
        >
          StockIt
        </motion.h1>

        {/* Tagline */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-[14px] font-mono text-text-muted mt-1"
        >
          Trade. Learn. Grow.
        </motion.p>

        {/* Pills */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex items-center space-x-2 mt-6"
        >
          <div className="px-2 py-1 rounded-full bg-accent-red/20 border border-accent-red/10">
            <span className="text-[10px] font-bold text-accent-red whitespace-nowrap">₹0 Real Money</span>
          </div>
          <div className="px-2 py-1 rounded-full bg-accent-green/20 border border-accent-green/10">
            <span className="text-[10px] font-bold text-accent-green whitespace-nowrap">100% Real Data</span>
          </div>
          <div className="px-2 py-1 rounded-full bg-accent-gold/20 border border-accent-gold/10">
            <span className="text-[10px] font-bold text-accent-gold whitespace-nowrap">AI Powered</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center space-y-1">
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="text-[11px] text-text-muted"
        >
          Powered by real NSE/BSE data
        </motion.span>
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="text-[9px] text-text-muted/50 uppercase tracking-widest"
        >
          AI by Claude
        </motion.span>
      </div>

      {/* Loading Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-bg-secondary">
        <motion.div 
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.5, ease: "linear" }}
          className="h-full bg-accent-gold shadow-[0_0_10px_#F0A500]"
        />
      </div>
    </div>
  );
}
