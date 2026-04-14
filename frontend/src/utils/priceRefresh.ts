import { api } from '../api';

const PRICE_CACHE_KEY = 'stockit_holdings_price_cache_v1';
const PRICE_CACHE_TTL_MS = 5 * 60 * 1000;

type PriceEntry = {
  price: number;
  fetchedAt: number;
};

type PriceCache = Record<string, PriceEntry>;

function readPriceCache(): PriceCache {
  try {
    const raw = localStorage.getItem(PRICE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePriceCache(cache: PriceCache): void {
  localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(cache));
}

export async function refreshHoldingPrices(
  symbols: string[],
  options?: { force?: boolean }
): Promise<Record<string, number>> {
  const force = Boolean(options?.force);
  const now = Date.now();
  const cache = readPriceCache();
  const out: Record<string, number> = {};
  const toFetch: string[] = [];

  for (const raw of symbols) {
    const symbol = String(raw || '').toUpperCase().trim();
    if (!symbol) continue;
    const cached = cache[symbol];
    const isFresh = cached && (now - cached.fetchedAt) <= PRICE_CACHE_TTL_MS;
    if (!force && isFresh) {
      out[symbol] = cached.price;
    } else {
      toFetch.push(symbol);
    }
  }

  if (toFetch.length > 0) {
    const responses = await Promise.allSettled(
      toFetch.map((symbol) => api.getStockDetail(symbol))
    );
    responses.forEach((result, idx) => {
      const symbol = toFetch[idx];
      if (result.status !== 'fulfilled') return;
      const price = Number(result.value?.currentPrice ?? NaN);
      if (!Number.isFinite(price) || price <= 0) return;
      out[symbol] = price;
      cache[symbol] = { price, fetchedAt: now };
    });
    writePriceCache(cache);
  }

  return out;
}

export function applyLivePricesToPortfolio(portfolio: any, livePrices: Record<string, number>) {
  const holdings = Array.isArray(portfolio?.holdings) ? portfolio.holdings : [];
  const virtualCash = Number(portfolio?.virtualCash ?? 0);

  const enriched = holdings.map((h: any) => {
    const symbol = String(h?.stockSymbol || '').toUpperCase();
    const quantity = Number(h?.quantity ?? 0);
    const avgBuyPrice = Number(h?.avgBuyPrice ?? 0);
    const currentPrice = Number(livePrices[symbol] ?? h?.currentPrice ?? avgBuyPrice);
    const currentValue = currentPrice * quantity;
    const investedValue = avgBuyPrice * quantity;
    const pnl = (currentPrice - avgBuyPrice) * quantity;
    const pnlPct = avgBuyPrice > 0 ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;
    return {
      ...h,
      currentPrice,
      currentValue,
      pnl,
      pnlPct,
      investedValue,
    };
  });

  const totalInvested = enriched.reduce((sum: number, h: any) => sum + Number(h.investedValue || 0), 0);
  const totalCurrentValue = enriched.reduce((sum: number, h: any) => sum + Number(h.currentValue || 0), 0);
  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const totalPortfolioValue = virtualCash + totalCurrentValue;

  return {
    ...portfolio,
    holdings: enriched.map(({ investedValue, ...rest }: any) => rest),
    totalPnl,
    totalPnlPct,
    totalPortfolioValue,
    metrics: {
      ...(portfolio?.metrics || {}),
      totalValue: totalPortfolioValue,
      totalPnl,
      totalPnlPct,
      virtualCash,
      diversityScore: Number(portfolio?.diversityScore ?? portfolio?.metrics?.diversityScore ?? 0),
    },
  };
}

export function getPortfolioStats(portfolio: any) {
  const holdings = Array.isArray(portfolio?.holdings) ? portfolio.holdings : [];
  const virtualCash = Number(portfolio?.virtualCash ?? 0);
  const baseline = 100000;

  const totals = holdings.reduce(
    (acc: { invested: number; current: number }, h: any) => {
      const quantity = Number(h?.quantity ?? 0);
      const avgBuyPrice = Number(h?.avgBuyPrice ?? 0);
      const currentPrice = Number(h?.currentPrice ?? avgBuyPrice);
      acc.invested += avgBuyPrice * quantity;
      acc.current += currentPrice * quantity;
      return acc;
    },
    { invested: 0, current: 0 }
  );

  const totalValue = virtualCash + totals.current;
  const totalReturn = totalValue - baseline;
  const totalReturnPct = (totalReturn / baseline) * 100;

  const performers = holdings
    .map((h: any) => {
      const avgBuyPrice = Number(h?.avgBuyPrice ?? 0);
      const currentPrice = Number(h?.currentPrice ?? avgBuyPrice);
      const pnlPct = avgBuyPrice > 0 ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;
      return {
        symbol: String(h?.stockSymbol || ''),
        pnlPct,
      };
    })
    .filter((p: any) => p.symbol);

  let bestPerformer: { symbol: string; pnlPct: number } | null = null;
  let worstPerformer: { symbol: string; pnlPct: number } | null = null;
  for (const p of performers) {
    if (!bestPerformer || p.pnlPct > bestPerformer.pnlPct) bestPerformer = p;
    if (!worstPerformer || p.pnlPct < worstPerformer.pnlPct) worstPerformer = p;
  }

  return {
    totalValue,
    totalReturn,
    totalReturnPct,
    bestPerformer,
    worstPerformer,
    holdingsCount: holdings.length,
  };
}
