import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, TrendingUp, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.getLeaderboards();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading || !data) {
    return <div className="min-h-screen bg-bg-primary flex justify-center items-center text-accent-gold"><RefreshCw className="animate-spin mr-2"/> Loading Leaderboard...</div>;
  }

  const list = data.returns_leaderboard || [];

  return (
    <div className="min-h-screen w-full bg-bg-primary flex flex-col font-mono text-text-primary">
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border h-[60px] flex items-center justify-between px-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-heading font-bold flex items-center">
          <Trophy className="mr-2 text-accent-gold" size={20} />
          Leaderboard
        </h1>
        <div className="w-8" />
      </header>

      <main className="flex-1 pt-[80px] pb-10 px-4">
        <div className="space-y-4">
          <div className="bg-accent-gold/10 border border-accent-gold/20 rounded-2xl p-4 flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-accent-gold uppercase tracking-widest">Your Rank</span>
            <span className="text-lg font-heading font-bold text-text-primary">#{list.findIndex((u: any) => u.isCurrentUser) + 1}</span>
          </div>

          <div className="space-y-2">
            {list.map((user: any, index: number) => {
              const isCurrentUser = user.isCurrentUser;
              const rankColor = index === 0 ? 'text-accent-gold' : index === 1 ? 'text-[#C0C0C0]' : index === 2 ? 'text-[#CD7F32]' : 'text-text-muted';

              return (
                <div key={index} className={`flex items-center p-4 rounded-xl border ${isCurrentUser ? 'bg-bg-secondary border-accent-gold/50' : 'bg-bg-card border-border'}`}>
                  <div className={`w-8 font-heading font-bold text-lg ${rankColor}`}>#{index + 1}</div>
                  <div className="flex-1 ml-2">
                    <p className="text-sm font-bold text-text-primary">{user.name}</p>
                    <p className="text-[10px] text-text-muted">₹{user.portfolioValue.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold flex items-center justify-end ${user.returnPct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {user.returnPct >= 0 ? '+' : ''}{user.returnPct}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
