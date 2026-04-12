const API_BASE_URL = 'http://localhost:8000/api';

const fetchJson = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
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
  patchXP: (xpPoints: number) => fetchJson('/user/xp', { method: 'PATCH', body: JSON.stringify({ xpPoints }) }),
  getLeaderboards: () => fetchJson('/user/leaderboard'),
  
  // Dashboard
  getDashboard: () => fetchJson('/dashboard'),
  
  // Portfolio
  getPortfolio: () => fetchJson('/portfolio'),
  getTransactions: () => fetchJson('/portfolio/transactions'),
  
  // Stocks
  getStocks: () => fetchJson('/stocks'),
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
    
  // Time Machine
  getScenarios: () => fetchJson('/time-machine/scenarios'),
  saveAttempt: (scenarioId: number, choice: string) => 
    fetchJson('/time-machine/attempt', { method: 'POST', body: JSON.stringify({ scenarioId, choice }) }),
  getTimeMachineScore: () => fetchJson('/time-machine/score'),
  
  // AI
  getMentorInsight: (action: string, symbol: string) => 
    fetchJson('/ai/mentor', { method: 'POST', body: JSON.stringify({ action, symbol }) }),
  getLossDebrief: (stockSymbol: string, lossAmount: number) => 
    fetchJson('/ai/loss-debrief', { method: 'POST', body: JSON.stringify({ stockSymbol, lossAmount }) }),
  analyzePortfolio: () => 
    fetchJson('/ai/analyze-portfolio', { method: 'POST', body: "{}" }),
  getMentorHistory: () => fetchJson('/ai/mentor-history'),
};
