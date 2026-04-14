import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

const MARKET_CACHE_KEY = 'stockit_trade_market_cache_v1';
const ONE_HOUR_MS = 60 * 60 * 1000;
const PAGE_SIZE = 15;

type CachedMarketPayload = {
  stocks: any[];
  indices: any;
  timestamp: number;
};

function readPersistedMarketCache(): CachedMarketPayload | null {
  try {
    const raw = localStorage.getItem(MARKET_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.stocks)) return null;
    return {
      stocks: parsed.stocks,
      indices: parsed.indices || null,
      timestamp: Number(parsed.timestamp || 0),
    };
  } catch {
    return null;
  }
}

async function fetchStocksSnapshot(targetCount: number) {
  const wanted = Math.max(PAGE_SIZE, Number(targetCount || PAGE_SIZE));
  let offset = 0;
  let hasMore = true;
  let merged: any[] = [];
  let lastChunkLength = 0;

  while (hasMore && merged.length < wanted) {
    const chunk = await api.getStocks(PAGE_SIZE, offset);
    const safeChunk = Array.isArray(chunk) ? chunk : [];
    const map = new Map<string, any>();
    merged.forEach((item) => map.set(item?.symbol, item));
    safeChunk.forEach((item) => map.set(item?.symbol, item));
    merged = Array.from(map.values());
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
}

export function getFallbackMarketData() {
  return [
    {
      symbol: 'RELIANCE',
      companyName: 'Reliance Industries Ltd',
      currentPrice: 2847.3,
      change: 0,
      changePercent: 0,
    },
    {
      symbol: 'TCS',
      companyName: 'Tata Consultancy Services',
      currentPrice: 3421.55,
      change: 0,
      changePercent: 0,
    },
    {
      symbol: 'HDFCBANK',
      companyName: 'HDFC Bank Ltd',
      currentPrice: 1643.2,
      change: 0,
      changePercent: 0,
    },
    {
      symbol: 'INFY',
      companyName: 'Infosys Ltd',
      currentPrice: 1482.1,
      change: 0,
      changePercent: 0,
    },
  ];
}

export function useCachedMarketData(targetCount: number) {
  const persisted = useMemo(() => readPersistedMarketCache(), []);

  const stocksQuery = useQuery({
    queryKey: ['marketStocks', Math.max(PAGE_SIZE, targetCount)],
    queryFn: () => fetchStocksSnapshot(Math.max(PAGE_SIZE, targetCount)),
    staleTime: ONE_HOUR_MS,
    refetchInterval: ONE_HOUR_MS,
    initialData: persisted?.stocks?.length
      ? {
          stocks: persisted.stocks,
          nextOffset: persisted.stocks.length,
          hasMoreStocks: true,
        }
      : undefined,
  });

  const indicesQuery = useQuery({
    queryKey: ['marketIndices'],
    queryFn: api.getMarketIndices,
    staleTime: ONE_HOUR_MS,
    refetchInterval: ONE_HOUR_MS,
    initialData: persisted?.indices || undefined,
  });

  useEffect(() => {
    const stocks = stocksQuery.data?.stocks;
    const indices = indicesQuery.data;
    if (!Array.isArray(stocks) || stocks.length === 0) return;
    try {
      const payload: CachedMarketPayload = {
        stocks,
        indices: indices || null,
        timestamp: Date.now(),
      };
      localStorage.setItem(MARKET_CACHE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore localStorage errors to avoid breaking the UI flow.
    }
  }, [stocksQuery.data, indicesQuery.data]);

  return {
    stocks: stocksQuery.data?.stocks || [],
    indices: indicesQuery.data || persisted?.indices || null,
    nextOffset: Number(stocksQuery.data?.nextOffset || 0),
    hasMoreStocks: Boolean(stocksQuery.data?.hasMoreStocks),
    isLoading: stocksQuery.isLoading && !persisted?.stocks?.length,
    isRefreshing: stocksQuery.isFetching || indicesQuery.isFetching,
    refetchAll: async () => {
      await Promise.all([stocksQuery.refetch(), indicesQuery.refetch()]);
    },
    hasCachedData: Boolean(persisted?.stocks?.length),
    cacheTimestamp: Number(persisted?.timestamp || 0),
  };
}
