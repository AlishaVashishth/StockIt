import PaperBadge from './PaperBadge';

export default function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto bg-bg-primary/80 backdrop-blur-md border-bottom border-border h-[60px] flex items-center justify-between px-4 z-50">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-accent-gold rounded-lg flex items-center justify-center font-bold text-bg-primary">IS</div>
        <span className="font-heading font-bold text-lg tracking-tight">InvestSim</span>
      </div>
      <PaperBadge />
    </header>
  );
}
