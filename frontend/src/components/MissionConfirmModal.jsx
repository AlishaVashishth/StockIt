import React from 'react';

export default function MissionConfirmModal({ isOpen, mission, onConfirm, onCancel }) {
  if (!isOpen || !mission) return null;

  return (
    <div className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-bg-card border border-border rounded-2xl p-5">
        <h3 className="text-lg font-bold text-text-primary">Are you sure?</h3>
        <p className="text-sm text-text-muted mt-2">
          Only mark this complete if you've actually done it. This cannot be undone.
        </p>
        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-border text-text-muted font-bold">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-accent-gold text-bg-primary font-bold">
            Yes, I did it
          </button>
        </div>
      </div>
    </div>
  );
}
