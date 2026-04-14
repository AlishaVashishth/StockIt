import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function XPToast() {
  const [amount, setAmount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onEarned = (event) => {
      const earned = Number(event?.detail?.amount || 0);
      if (!earned) return;
      setAmount(earned);
      setOpen(true);
      setTimeout(() => setOpen(false), 2000);
    };

    window.addEventListener('xp-earned', onEarned);
    return () => window.removeEventListener('xp-earned', onEarned);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[250] px-5 py-2 rounded-full bg-bg-card border border-accent-gold/30 shadow-xl"
        >
          <span className="text-accent-gold font-bold text-sm">+{amount} XP</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
