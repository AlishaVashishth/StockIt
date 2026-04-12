import { MOCK_MARKET } from '../constants';

export default function MarketTicker() {
  return (
    <div className="bg-bg-secondary border-b border-border py-2 px-4 flex items-center space-x-6 overflow-x-auto no-scrollbar">
      <div className="flex items-center space-x-2 whitespace-nowrap">
        <span className="text-[10px] font-bold text-text-muted uppercase">NIFTY 50</span>
        <span className="text-xs font-mono font-bold">{MOCK_MARKET.nifty.value.toLocaleString('en-IN')}</span>
        <span className="text-[10px] font-mono font-bold text-accent-green">+{MOCK_MARKET.nifty.changePercent}%</span>
      </div>
      <div className="flex items-center space-x-2 whitespace-nowrap">
        <span className="text-[10px] font-bold text-text-muted uppercase">SENSEX</span>
        <span className="text-xs font-mono font-bold">{MOCK_MARKET.sensex.value.toLocaleString('en-IN')}</span>
        <span className="text-[10px] font-mono font-bold text-accent-green">+{MOCK_MARKET.sensex.changePercent}%</span>
      </div>
    </div>
  );
}
