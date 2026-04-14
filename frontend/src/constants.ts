import { Stock, Holding, UserProfile } from './types';

export const MOCK_USER: UserProfile = {
  name: "Arjun Kumar",
  tier: "🐇 Rabbit — Building Momentum",
  xp: 340,
  daysActive: 12,
  portfolioValue: 114230,
  todayPnl: 1420,
  todayPnlPercent: 1.26,
  cashAvailable: 37450,
};

export const MOCK_HOLDINGS: Holding[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", shares: 8, avgPrice: 2801, price: 2847, change: 46, changePercent: 1.6, pnl: 368, pnlPercent: 1.6 },
  { symbol: "TCS", name: "Tata Consultancy Services", shares: 5, avgPrice: 3200, price: 3421, change: 221, changePercent: 6.9, pnl: 1105, pnlPercent: 6.9 },
  { symbol: "TATAMOTORS", name: "Tata Motors", shares: 15, avgPrice: 820, price: 924, change: 104, changePercent: 12.7, pnl: 1560, pnlPercent: 12.7 },
  { symbol: "YESBANK", name: "Yes Bank", shares: 100, avgPrice: 36, price: 24, change: -12, changePercent: -33.3, pnl: -1200, pnlPercent: -33.3 },
  { symbol: "ZOMATO", name: "Zomato", shares: 50, avgPrice: 195, price: 182, change: -13, changePercent: -6.7, pnl: -650, pnlPercent: -6.7 },
];

export const MOCK_WATCHLIST: Stock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2847.30, change: 33.85, changePercent: 1.2 },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 3421.55, change: 27.15, changePercent: 0.8 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1643.20, change: -4.95, changePercent: -0.3 },
  { symbol: "INFY", name: "Infosys", price: 1482.10, change: 30.50, changePercent: 2.1 },
  { symbol: "TATAMOTORS", name: "Tata Motors", price: 924.45, change: 30.40, changePercent: 3.4 },
  { symbol: "ZOMATO", name: "Zomato", price: 182.30, change: -3.35, changePercent: -1.8 },
  { symbol: "YESBANK", name: "Yes Bank", price: 24.15, change: -0.22, changePercent: -0.9 },
  { symbol: "ADANIPORTS", name: "Adani Ports", price: 1247.80, change: 6.20, changePercent: 0.5 },
];

export const MOCK_MARKET = {
  nifty: { value: 22347.80, change: 93.45, changePercent: 0.42 },
  sensex: { value: 73847.45, change: 280.15, changePercent: 0.38 },
};
