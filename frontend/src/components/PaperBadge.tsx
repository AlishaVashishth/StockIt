export default function PaperBadge() {
  return (
    <div className="bg-bg-card border border-border px-3 py-1 rounded-full flex items-center space-x-2">
      <div className="w-2 h-2 bg-accent-gold rounded-full animate-pulse" />
      <span className="text-[10px] font-bold text-text-primary tracking-widest uppercase">Paper Trading Mode</span>
    </div>
  );
}
