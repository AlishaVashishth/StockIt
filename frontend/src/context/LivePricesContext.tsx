import React, { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../api';

type LivePriceMap = Record<string, number>;

type LivePricesContextValue = {
  prices: LivePriceMap;
  updateFromStocks: (stocks: Array<{ symbol?: string; currentPrice?: number }>) => void;
  refreshFromMarket: () => Promise<void>;
  isRefreshing: boolean;
};

const STORAGE_KEY = 'stockit_live_prices_v1';

const LivePricesContext = createContext<LivePricesContextValue | null>(null);

function readInitialPrices(): LivePriceMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function LivePricesProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<LivePriceMap>(() => readInitialPrices());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const updateFromStocks = (stocks: Array<{ symbol?: string; currentPrice?: number }>) => {
    if (!Array.isArray(stocks) || stocks.length === 0) return;
    setPrices((prev) => {
      const next = { ...prev };
      for (const stock of stocks) {
        const symbol = String(stock?.symbol || '').toUpperCase().replace('.NS', '').trim();
        const price = Number(stock?.currentPrice ?? NaN);
        if (!symbol || !Number.isFinite(price) || price <= 0) continue;
        next[symbol] = price;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const refreshFromMarket = async () => {
    setIsRefreshing(true);
    try {
      const pageSize = 30;
      let offset = 0;
      const allStocks: Array<{ symbol?: string; currentPrice?: number }> = [];
      while (true) {
        const page = await api.getStocks(pageSize, offset);
        const safe = Array.isArray(page) ? page : [];
        if (safe.length === 0) break;
        allStocks.push(...safe);
        if (safe.length < pageSize) break;
        offset += safe.length;
      }
      updateFromStocks(allStocks);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const value = useMemo(
    () => ({ prices, updateFromStocks, refreshFromMarket, isRefreshing }),
    [prices, isRefreshing]
  );
  return <LivePricesContext.Provider value={value}>{children}</LivePricesContext.Provider>;
}

export function useLivePrices() {
  const ctx = useContext(LivePricesContext);
  if (!ctx) throw new Error('useLivePrices must be used within LivePricesProvider');
  return ctx;
}
