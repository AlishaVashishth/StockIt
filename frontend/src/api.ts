const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_BASE_URL = `${BASE_URL}/api`;

/** Chart tabs send 1w/1m/3m; backend expects 1wk/1mo/3mo for history and AI context. */
export function normalizeChartTimeframe(tf: string): string {
  const t = (tf || '1d').toLowerCase().trim();
  const aliases: Record<string, string> = { '1w': '1wk', '1m': '1mo', '3m': '3mo' };
  return aliases[t] ?? t;
}

const fetchJson = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const userEmail = localStorage.getItem('investsim_user_email') || "";
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail || "",
        ...options?.headers,
      },
    });
    if (!response.ok) {
      let errorMsg = `API call failed: ${response.statusText}`;
      try {
        const errorData = await response.clone().json();
        if (errorData && errorData.detail) {
          errorMsg = errorData.detail;
        }
      } catch (e) {
        // ignore JSON parse error
      }
      throw new Error(errorMsg);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
};

export const api = {
  // User
  getUser: () => fetchJson('/user'),
  startSession: (name: string, email: string, password: string) => fetchJson('/user/start-session', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  patchXP: (xpPoints: number) => fetchJson('/user/xp', { method: 'PATCH', body: JSON.stringify({ xpPoints }) }),
  getLeaderboards: () => fetchJson('/user/leaderboard'),
  
  // Dashboard
  getDashboard: () => fetchJson('/dashboard'),
  
  // Portfolio
  getPortfolio: () => fetchJson('/portfolio'),
  getTransactions: () => fetchJson('/portfolio/transactions'),
  
  // Stocks
  getStocks: (limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (typeof limit === 'number') params.set('limit', String(limit));
    if (typeof offset === 'number') params.set('offset', String(offset));
    const query = params.toString();
    return fetchJson(`/stocks${query ? `?${query}` : ''}`);
  },
  getMarketIndices: () => fetchJson('/stocks/indices/live'),
  getStockDetail: (symbol: string) => fetchJson(`/stocks/${symbol}`),
  getStockHistory: (symbol: string, period = '1d') =>
    fetchJson(`/stocks/${symbol}/history?period=${normalizeChartTimeframe(period)}`),
  
  // Trades
  buyTrade: (stockSymbol: string, quantity: number, orderType = "MARKET") => 
    fetchJson('/trades/buy', { method: 'POST', body: JSON.stringify({ stockSymbol, quantity, orderType }) }),
  sellTrade: (stockSymbol: string, quantity: number) => 
    fetchJson('/trades/sell', { method: 'POST', body: JSON.stringify({ stockSymbol, quantity }) }),
  
  // Learn
  getLearnModules: () => fetchJson('/learn/modules'),
  getLearnLessons: (moduleId: number) => fetchJson(`/learn/modules/${moduleId}/lessons`),
  completeLesson: (lessonId: number, moduleId: number, quizScore: number) => 
    fetchJson('/learn/complete', { method: 'POST', body: JSON.stringify({ lessonId, moduleId, quizScore }) }),
  getMissions: () => fetchJson('/learn/missions'),
  completeMission: (missionKey: string) => 
    fetchJson('/learn/missions/complete', { method: 'POST', body: JSON.stringify({ missionKey }) }),
    
  // Loss Simulator
  getScenarios: () => fetchJson('/loss-simulator/scenarios'),
  saveAttempt: (scenarioId: number, choice: string) => 
    fetchJson('/loss-simulator/attempt', { method: 'POST', body: JSON.stringify({ scenarioId, choice }) }),
  getTimeMachineScore: () => fetchJson('/loss-simulator/score'),
  
  // AI
  getMentorInsight: (action: string, symbol: string, timeframe = '1d', requestId?: string) =>
    fetchJson('/ai/mentor', {
      method: 'POST',
      body: JSON.stringify({
        action,
        symbol,
        timeframe: normalizeChartTimeframe(timeframe),
        requestId,
      }),
    }),
  getLossDebrief: (stockSymbol: string, lossAmount: number) => 
    fetchJson('/ai/loss-debrief', { method: 'POST', body: JSON.stringify({ stockSymbol, lossAmount }) }),
  analyzePortfolio: (requestId?: string) => 
    fetchJson('/ai/analyze-portfolio', { method: 'POST', body: JSON.stringify({ requestId }) }),
  getMentorHistory: () => fetchJson('/ai/mentor-history'),
};
