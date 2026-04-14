import React from 'react';

export default function MarketSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="bg-bg-card border border-border p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-bg-secondary border border-border" />
            <div>
              <div className="h-3 w-20 bg-bg-secondary rounded mb-2" />
              <div className="h-2 w-28 bg-bg-secondary rounded" />
            </div>
          </div>
          <div className="text-right">
            <div className="h-3 w-20 bg-bg-secondary rounded mb-2 ml-auto" />
            <div className="h-2 w-14 bg-bg-secondary rounded ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
