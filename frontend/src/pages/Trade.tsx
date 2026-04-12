import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { api } from '../api';

const SECTORS = [
  { name: 'IT', change: 1.8 },
  { name: 'Banking', change: -0.2 },
  { name: 'Auto', change: 2.4 },
  { name: 'Energy', change: 1.1 },
];

export default function Trade() {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [flashStates, setFlashStates] = useState<Record<string, 'up' | 'down' | null>>({});
  
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const data = await api.getStocks();
        setStocks(prevStocks => {
          const newFlashStates: Record<string, 'up' | 'down' | null> = {};
          if (prevStocks.length > 0) {
             data.forEach((newStock: any) => {
               const oldStock = prevStocks.find(s => s.symbol === newStock.symbol);
               if (oldStock) {
                 if (newStock.currentPrice > oldStock.currentPrice) newFlashStates[newStock.symbol] = 'up';
                 else if (newStock.currentPrice < oldStock.currentPrice) newFlashStates[newStock.symbol] = 'down';
               }
             });
          }
          setFlashStates(newFlashStates);
          setTimeout(() => setFlashStates({}), 1000);
          return data;
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
    const interval = setInterval(fetchStocks, 10000); 
    return () => clearInterval(interval);
  }, []);

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen w-full bg-bg-primary flex flex-col">
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-xl font-heading font-bold text-text-primary">📈 Market</h1>
          <div className="px-2 py-0.5 rounded-full bg-accent-green/10 border border-accent-green/20">
            <span className="text-[10px] font-bold text-accent-green uppercase tracking-wider">🟢 OPEN</span>
          </div>
        </div>
        <p className="text-[11px] font-mono text-text-muted">NSE · Mon–Fri · 9:15 AM – 3:30 PM (Simulated)</p>
      </header>

      <main className="flex-1 pt-[85px] pb-[80px] px-4 overflow-y-auto no-scrollbar">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card border border-border rounded-2xl p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 bg-accent-green/[0.03] p-2 rounded-xl">
              <p className="text-[11px] font-mono text-text-muted mb-1">NIFTY 50</p>
              <p className="text-lg font-heading font-bold text-text-primary">22,347.80</p>
              <p className="text-xs font-mono font-bold text-accent-green">▲ 0.42%</p>
            </div>
            
            <div className="w-[1px] h-12 bg-border mx-4" />
            
            <div className="flex-1 p-2">
              <p className="text-[11px] font-mono text-text-muted mb-1">SENSEX</p>
              <p className="text-lg font-heading font-bold text-text-primary">73,847.45</p>
              <p className="text-xs font-mono font-bold text-accent-green">▲ 0.38%</p>
            </div>
          </div>
          <div className="mt-3 text-center">
            <p className="text-[12px] font-mono text-text-primary">Market Mood: <span className="text-accent-green font-bold">🟢 Bullish Today</span></p>
          </div>
        </motion.div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-heading font-bold text-text-primary">Market Listing</h2>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-bg-secondary border border-border rounded-xl pl-10 pr-4 text-sm font-mono text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
            />
          </div>

          {loading ? (
             <div className="py-10 flex items-center justify-center text-accent-gold">
               <RefreshCw className="animate-spin mr-2" /> Loading Market...
             </div>
          ) : (
            <div className="space-y-2">
              {filteredStocks.map((stock) => {
                const flash = flashStates[stock.symbol];
                const change = stock.change;
                const changePercent = stock.changePercent;
                const isPositive = change >= 0;

                return (
                  <motion.div
                    key={stock.symbol}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/trade/${stock.symbol.replace('.NS', '')}`)}
                    className="bg-bg-card border border-border p-4 rounded-2xl flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center border border-border">
                        <span className="text-xs font-mono font-bold text-accent-gold">{stock.symbol.substring(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-mono font-bold text-text-primary">{stock.symbol.replace('.NS', '')}</p>
                        <p className="text-[11px] text-text-muted truncate w-32">{stock.name}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-sm font-mono font-bold transition-colors duration-300 ${
                        flash === 'up' ? 'text-accent-green' : 
                        flash === 'down' ? 'text-accent-red' : 
                        'text-text-primary'
                      }`}>
                        ₹{stock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className={`flex items-center justify-end space-x-1 ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                        <span className="text-[12px] font-mono font-bold">
                          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                        </span>
                        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-heading font-bold text-text-primary mb-4">Sectors Today</h2>
          <div className="flex space-x-3 overflow-x-auto no-scrollbar -mx-4 px-4">
            {SECTORS.map((sector, i) => (
              <div key={i} className="flex-shrink-0 w-[90px] h-[70px] bg-bg-card border border-border rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-text-muted uppercase">{sector.name}</span>
                <span className={`text-sm font-heading font-bold ${sector.change >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {sector.change >= 0 ? '+' : ''}{sector.change}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
