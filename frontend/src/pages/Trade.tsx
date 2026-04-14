import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { api } from '../api';

const SECTORS = [
  { name: 'IT', change: 1.8 },
  { name: 'Banking', change: -0.2 },
  { name: 'Auto', change: 2.4 },
  { name: 'Energy', change: 1.1 },
];

export default function Trade() {
  const PAGE_SIZE = 15;
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<any[]>([]);
  const [indices, setIndices] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [flashStates, setFlashStates] = useState<Record<string, 'up' | 'down' | null>>({});
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMoreStocks, setHasMoreStocks] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadedCountRef = useRef(PAGE_SIZE);

  const mergeUniqueStocks = (existing: any[], incoming: any[]) => {
    const map = new Map<string, any>();
    existing.forEach((s) => map.set(s.symbol, s));
    incoming.forEach((s) => map.set(s.symbol, s));
    return Array.from(map.values());
  };

  const fetchStocksSnapshot = async (targetCount: number) => {
    const minCount = Math.max(PAGE_SIZE, targetCount);
    let offset = 0;
    let hasMore = true;
    let lastChunkLength = 0;
    let merged: any[] = [];

    while (hasMore && merged.length < minCount) {
      const chunk = await api.getStocks(PAGE_SIZE, offset);
      const safeChunk = Array.isArray(chunk) ? chunk : [];
      merged = mergeUniqueStocks(merged, safeChunk);
      lastChunkLength = safeChunk.length;
      if (safeChunk.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        offset += safeChunk.length;
      }
    }

    return {
      stocks: merged,
      nextOffset: merged.length,
      hasMoreStocks: hasMore && lastChunkLength === PAGE_SIZE,
    };
  };

  const applyRefreshedStocks = (data: any[]) => {
    setStocks((prevStocks) => {
      const newFlashStates: Record<string, 'up' | 'down' | null> = {};
      if (prevStocks.length > 0) {
        data.forEach((newStock: any) => {
          const oldStock = prevStocks.find((s) => s.symbol === newStock.symbol);
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
  };

  useEffect(() => {
    loadedCountRef.current = Math.max(PAGE_SIZE, stocks.length);
  }, [stocks.length]);
  
  useEffect(() => {
    const loadMoreStocks = async (background = false) => {
      if (!hasMoreStocks || isLoadingMore) return;
      if (!background) setIsLoadingMore(true);
      try {
        const chunk = await api.getStocks(PAGE_SIZE, nextOffset);
        const safeChunk = Array.isArray(chunk) ? chunk : [];
        setStocks((prev) => mergeUniqueStocks(prev, safeChunk));
        setNextOffset((prev) => prev + safeChunk.length);
        if (safeChunk.length < PAGE_SIZE) setHasMoreStocks(false);
      } catch (err) {
        console.error(err);
      } finally {
        if (!background) setIsLoadingMore(false);
      }
    };

    const fetchStocks = async () => {
      try {
        const [stocksRes, indicesRes] = await Promise.allSettled([
          fetchStocksSnapshot(loadedCountRef.current),
          api.getMarketIndices()
        ]);

        if (indicesRes.status === 'fulfilled') {
          setIndices(indicesRes.value);
        }

        if (stocksRes.status !== 'fulfilled') {
          throw stocksRes.reason;
        }

        const snapshot = stocksRes.value;
        const data = Array.isArray(snapshot?.stocks) ? snapshot.stocks : [];
        setNextOffset(Number(snapshot?.nextOffset || data.length));
        setHasMoreStocks(Boolean(snapshot?.hasMoreStocks));
        applyRefreshedStocks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
    // After first paint, prefetch next chunk in background.
    const prefetchTimer = setTimeout(() => {
      loadMoreStocks(true);
    }, 300);
    const interval = setInterval(fetchStocks, 10000); 
    return () => {
      clearTimeout(prefetchTimer);
      clearInterval(interval);
    };
  }, []);

  const nifty = indices?.nifty || { value: 0, changePct: 0 };
  const sensex = indices?.sensex || { value: 0, changePct: 0 };
  const niftyUp = Number(nifty.changePct) >= 0;
  const sensexUp = Number(sensex.changePct) >= 0;

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (stock.companyName || stock.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefreshMarket = async () => {
    setIsRefreshing(true);
    try {
      const [snapshot, indicesRes] = await Promise.all([
        fetchStocksSnapshot(loadedCountRef.current),
        api.getMarketIndices(),
      ]);
      const data = Array.isArray(snapshot?.stocks) ? snapshot.stocks : [];
      applyRefreshedStocks(data);
      setIndices(indicesRes);
      setNextOffset(Number(snapshot?.nextOffset || data.length));
      setHasMoreStocks(Boolean(snapshot?.hasMoreStocks));
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-bg-primary flex flex-col">
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-xl font-heading font-bold text-text-primary">📈 Market</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshMarket}
              disabled={isRefreshing}
              className="p-2 rounded-lg border border-border text-text-muted"
              aria-label="Refresh market"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            </button>
            <div className="px-2 py-0.5 rounded-full bg-accent-green/10 border border-accent-green/20">
              <span className="text-[10px] font-bold text-accent-green uppercase tracking-wider">🟢 OPEN</span>
            </div>
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
              <p className="text-lg font-heading font-bold text-text-primary">{Number(nifty.value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              <p className={`text-xs font-mono font-bold ${niftyUp ? 'text-accent-green' : 'text-accent-red'}`}>
                {niftyUp ? '▲' : '▼'} {Math.abs(Number(nifty.changePct || 0)).toFixed(2)}%
              </p>
            </div>
            
            <div className="w-[1px] h-12 bg-border mx-4" />
            
            <div className="flex-1 p-2">
              <p className="text-[11px] font-mono text-text-muted mb-1">SENSEX</p>
              <p className="text-lg font-heading font-bold text-text-primary">{Number(sensex.value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              <p className={`text-xs font-mono font-bold ${sensexUp ? 'text-accent-green' : 'text-accent-red'}`}>
                {sensexUp ? '▲' : '▼'} {Math.abs(Number(sensex.changePct || 0)).toFixed(2)}%
              </p>
            </div>
          </div>
          <div className="mt-3 text-center">
            <p className="text-[12px] font-mono text-text-primary">
              Market Mood: <span className={`font-bold ${niftyUp ? 'text-accent-green' : 'text-accent-red'}`}>{niftyUp ? '🟢 Bullish Today' : '🔴 Cautious Today'}</span>
            </p>
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
              placeholder="Search assets..."
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
                        <p className="text-[11px] text-text-muted truncate w-32">{stock.companyName || stock.name}</p>
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

              {searchQuery.trim().length === 0 && hasMoreStocks && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (isLoadingMore) return;
                    setIsLoadingMore(true);
                    try {
                      const chunk = await api.getStocks(PAGE_SIZE, nextOffset);
                      const safeChunk = Array.isArray(chunk) ? chunk : [];
                      setStocks((prev) => {
                        const map = new Map<string, any>();
                        prev.forEach((s) => map.set(s.symbol, s));
                        safeChunk.forEach((s) => map.set(s.symbol, s));
                        return Array.from(map.values());
                      });
                      setNextOffset((prev) => prev + safeChunk.length);
                      if (safeChunk.length < PAGE_SIZE) setHasMoreStocks(false);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setIsLoadingMore(false);
                    }
                  }}
                  className="w-full mt-3 bg-blue-500/10 border border-blue-400/30 rounded-2xl p-4 flex items-center justify-center space-x-2 text-blue-300"
                >
                  <span className="text-sm font-heading font-bold">
                    {isLoadingMore ? 'Loading...' : 'View more'}
                  </span>
                  <ChevronDown size={16} />
                </motion.button>
              )}
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
