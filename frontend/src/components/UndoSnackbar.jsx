import React from 'react';

export default function UndoSnackbar({ open, text, onUndo }) {
  if (!open) return null;
  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[230] bg-bg-card border border-border rounded-full px-4 py-2 flex items-center gap-3">
      <span className="text-xs text-text-primary">{text}</span>
      <button onClick={onUndo} className="text-xs font-bold text-accent-gold">
        Undo
      </button>
    </div>
  );
}
