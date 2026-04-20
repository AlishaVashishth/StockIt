import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardViewerProps {
  cards: Flashcard[];
  onDone?: () => void;
}

export default function FlashcardViewer({ cards, onDone }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [finished, setFinished] = useState(false);

  // Touch swipe
  const touchStartX = useRef<number | null>(null);

  const goNext = () => {
    if (currentIndex < cards.length - 1) {
      setDirection('left');
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setDirection(null);
      }, 150);
    } else {
      setFinished(true);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection('right');
      setTimeout(() => {
        setCurrentIndex((i) => i - 1);
        setDirection(null);
      }, 150);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
    touchStartX.current = null;
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setFinished(false);
    setDirection(null);
  };

  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 px-4 text-center"
      >
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-heading font-bold text-text-primary mb-2">All Done!</h3>
        <p className="text-sm text-text-muted mb-8">You've reviewed all {cards.length} cards from this report.</p>
        <button
          onClick={handleRestart}
          className="w-full py-3 rounded-xl bg-accent-gold text-bg-primary font-bold text-sm flex items-center justify-center space-x-2"
        >
          <RotateCcw size={16} />
          <span>Restart</span>
        </button>
        {onDone && (
          <button
            onClick={onDone}
            className="w-full mt-3 py-3 rounded-xl border border-border text-text-muted font-bold text-sm"
          >
            Analyze New PDF
          </button>
        )}
      </motion.div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="flex flex-col w-full">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
          Insight {currentIndex + 1} of {cards.length}
        </span>
        <div className="flex space-x-1">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'bg-accent-gold w-5'
                  : i < currentIndex
                  ? 'bg-accent-gold/40 w-2'
                  : 'bg-border w-2'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: direction === 'left' ? 60 : direction === 'right' ? -60 : 0 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction === 'left' ? -60 : 60 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="w-full"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            onClick={goNext}
            className="relative w-full cursor-pointer select-none rounded-2xl border border-border bg-bg-card shadow-md p-5 flex flex-col justify-between"
            style={{ height: '58vw', minHeight: 210, maxHeight: 300 }}
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-mono text-accent-gold uppercase tracking-widest border border-accent-gold/30 px-2 py-0.5 rounded-full bg-accent-gold/5">
                Fact
              </span>
              <span className="text-[9px] font-mono text-text-muted">Tap to continue</span>
            </div>
            <p className="text-base font-heading font-bold text-text-primary leading-snug flex-1 flex items-center mt-3">
              {card.question}
            </p>
            <div className="flex justify-center mt-2">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-border" />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5 gap-3">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className={`flex-1 py-3 rounded-xl border font-bold text-sm flex items-center justify-center space-x-1 transition-opacity ${
            currentIndex === 0
              ? 'border-border text-text-muted opacity-30'
              : 'border-border text-text-primary active:scale-95'
          }`}
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>

        <button
          onClick={goNext}
          className="flex-1 py-3 rounded-xl bg-accent-gold text-bg-primary font-bold text-sm flex items-center justify-center space-x-1 active:scale-95 transition-all"
        >
          <span>{currentIndex === cards.length - 1 ? 'Finish' : 'Next'}</span>
          <ChevronRight size={16} />
        </button>
      </div>

      <p className="text-center text-[10px] text-text-muted mt-3 font-mono">Swipe left / right to navigate</p>
    </div>
  );
}