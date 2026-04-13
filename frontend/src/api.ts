const API_BASE_URL = 'http://localhost:8000/api';

const fetchJson = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const userEmail = localStorage.getItem('investsim_user_email') || '';
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail,
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
  getStocks: () => fetchJson('/stocks'),
  getMarketIndices: () => fetchJson('/stocks/indices/live'),
  getStockDetail: (symbol: string) => fetchJson(`/stocks/${symbol}`),
  getStockHistory: (symbol: string, period = '1d') => fetchJson(`/stocks/${symbol}/history?period=${period}`),
  
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
    fetchJson('/ai/mentor', { method: 'POST', body: JSON.stringify({ action, symbol, timeframe, requestId }) }),
  getLossDebrief: (stockSymbol: string, lossAmount: number) => 
    fetchJson('/ai/loss-debrief', { method: 'POST', body: JSON.stringify({ stockSymbol, lossAmount }) }),
  analyzePortfolio: (requestId?: string) => 
    fetchJson('/ai/analyze-portfolio', { method: 'POST', body: JSON.stringify({ requestId }) }),
  getMentorHistory: () => fetchJson('/ai/mentor-history'),
};
