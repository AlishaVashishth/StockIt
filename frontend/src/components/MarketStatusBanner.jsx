import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getMarketStatus } from '../utils/marketStatus';

export default function MarketStatusBanner() {
  const [status, setStatus] = useState(() => getMarketStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(getMarketStatus());
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const content = useMemo(() => {
    if (status.isOpen) {
      return {
        emoji: '🟢',
        title: status.label,
        subtitle: status.description,
        className: 'bg-green-100 text-green-800 border-green-200',
      };
    }
    return {
      emoji: '🔴',
      title: status.label,
      subtitle: status.description,
      className: 'bg-red-100 text-red-800 border-red-200',
    };
  }, [status]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`sticky top-0 z-40 w-full h-[50px] border-b px-4 flex items-center justify-center text-center ${content.className}`}
    >
      <div className="leading-tight">
        <p className="text-sm font-semibold">{content.emoji} {content.title}</p>
        <p className="text-[11px]">{content.subtitle}</p>
      </div>
    </motion.div>
  );
}

