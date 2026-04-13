export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface Holding extends Stock {
  shares: number;
  avgPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface UserProfile {
  name: string;
  tier: string;
  xp: number;
  daysActive: number;
  streakCount?: number;
  portfolioValue: number;
  todayPnl: number;
  todayPnlPercent: number;
  cashAvailable: number;
}