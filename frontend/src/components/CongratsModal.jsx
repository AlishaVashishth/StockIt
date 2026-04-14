import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function CongratsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.6 }
    });

    const timer = setTimeout(() => {
      onClose?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-card border border-border rounded-2xl p-6 text-center shadow-2xl">
        <div className="text-5xl mb-3">🎉</div>
        <h3 className="text-xl font-heading font-bold text-text-primary mb-2">Congratulations!</h3>
        <p className="text-sm text-text-primary/90 mb-6">
          You've completed the entire course!
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-accent-gold text-bg-primary font-bold"
        >
          Close
        </button>
      </div>
    </div>
  );
}
