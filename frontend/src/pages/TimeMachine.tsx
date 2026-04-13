import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, ArrowLeft, Clock, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, Info, RefreshCw
} from 'lucide-react';
import { api } from '../api';

export default function TimeMachine() {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userScore, setUserScore] = useState<any>(null);

  const [selectedScenario, setSelectedScenario] = useState<any | null>(null);
  const [gameState, setGameState] = useState<'browsing' | 'playing' | 'result'>('browsing');
  const [userChoice, setUserChoice] = useState<'BUY' | 'SKIP' | null>(null);
  const [resultOutcome, setResultOutcome] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scenarios, score] = await Promise.all([
          api.getScenarios(),
          api.getTimeMachineScore()
        ]);
        setData(scenarios);
        setUserScore(score);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gameState]);

  const handleStartScenario = (scenario: any) => {
    setSelectedScenario(scenario);
    setResultOutcome(null);
    setUserChoice(null);
    setGameState('playing');
  };

  const handleChoice = async (choice: 'BUY' | 'SKIP') => {
    setUserChoice(choice);
    setIsSubmitting(true);
    try {
      const availableChoiceIds = (selectedScenario?.choices || []).map((c: any) => c.id);
      let backendChoice = choice === 'BUY' ? 'buy' : 'skip';
      if (!availableChoiceIds.includes(backendChoice)) {
        backendChoice = availableChoiceIds.includes('wait') ? 'wait' : availableChoiceIds[0];
      }
      const response = await api.saveAttempt(selectedScenario.id, backendChoice);
      setResultOutcome(response?.outcome || null);
      setGameState('result');
    } catch(err) {
      console.error(err);
      setResultOutcome(null);
      setGameState('result');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setSelectedScenario(null);
    setGameState('browsing');
    setUserChoice(null);
  };

  if (loading && gameState === 'browsing') {
    return <div className="min-h-screen bg-bg-primary flex justify-center items-center text-accent-gold"><RefreshCw className="animate-spin mr-2"/> Time Traveling...</div>;
  }

  return (
    <div className="relative min-h-screen w-full bg-bg-primary flex flex-col font-mono text-text-primary overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border h-[60px] flex items-center px-4">
        {gameState !== 'browsing' ? (
          <button onClick={reset} className="mr-3 p-1"><ArrowLeft size={20} /></button>
        ) : null}
        <h1 className="text-xl font-heading font-bold flex items-center">
          <History className="mr-2 text-accent-gold" size={20} /> Time Machine
        </h1>
      </header>

      <main className="flex-1 pt-[80px] pb-[100px] px-4">
        <AnimatePresence mode="wait">
          {gameState === 'browsing' && (
            <motion.div key="browsing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="bg-bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 blur-3xl rounded-full -mr-16 -mt-16" />
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-heading font-bold text-accent-gold">Relive History</h2>
                  <div className="px-2 py-0.5 rounded bg-accent-gold/10 text-accent-gold text-xs font-bold border border-accent-gold/20">
                    {userScore?.totalSuccess} Won
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">Travel back to critical market moments. Make the call. See if you have what it takes to survive the past.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-heading font-bold uppercase tracking-widest text-text-muted">Available Scenarios</h3>
                {data.map((scenario: any) => (
                  <motion.button key={scenario.id} whileTap={{ scale: 0.98 }} onClick={() => handleStartScenario(scenario)} className="w-full bg-bg-card border border-border rounded-2xl p-4 text-left flex items-center justify-between group">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-bg-secondary rounded border border-border text-text-muted">{scenario.date}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${scenario.id <= 2 ? 'bg-accent-green/10 border-accent-green/30 text-accent-green' : scenario.id <= 4 ? 'bg-accent-gold/10 border-accent-gold/30 text-accent-gold' : 'bg-accent-red/10 border-accent-red/30 text-accent-red'}`}>
                          {scenario.id <= 2 ? 'Easy' : scenario.id <= 4 ? 'Medium' : 'Hard'}
                        </span>
                      </div>
                      <h4 className="text-base font-heading font-bold text-text-primary group-hover:text-accent-gold transition-colors">{scenario.title}</h4>
                      <p className="text-[11px] text-text-muted mt-1 line-clamp-1">{scenario.description}</p>
                    </div>
                    <ChevronRight size={20} className="text-text-muted group-hover:text-accent-gold transition-colors ml-4" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {gameState === 'playing' && selectedScenario && (
            <motion.div key="playing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-bg-secondary rounded-full border border-border">
                  <Clock size={12} className="text-accent-gold" />
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{selectedScenario.date}</span>
                </div>
                <h2 className="text-2xl font-heading font-bold text-text-primary">{selectedScenario.title}</h2>
              </div>

              <div className="bg-bg-card border border-border rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase mb-1">Stock</p>
                    <p className="text-xl font-heading font-bold text-accent-gold">{selectedScenario.stock}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-text-muted uppercase mb-1">Price</p>
                    <p className="text-xl font-heading font-bold text-text-primary">₹{selectedScenario.startPrice}</p>
                  </div>
                </div>

                <div className="p-4 bg-bg-secondary rounded-2xl border border-border">
                  <p className="text-sm leading-relaxed text-text-primary italic">"{selectedScenario.description}"</p>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-accent-blue/5 rounded-2xl border border-accent-blue/20">
                  <Info size={18} className="text-accent-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-accent-blue uppercase tracking-wider mb-1">Market Context</p>
                    <p className="text-[11px] text-text-primary leading-relaxed">{selectedScenario.concept}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button onClick={() => handleChoice('BUY')} disabled={isSubmitting} className="py-4 bg-accent-green text-bg-primary rounded-2xl font-heading font-bold text-lg shadow-[0_4px_20px_rgba(0,212,161,0.2)] active:scale-95 transition-transform disabled:opacity-50">BUY</button>
                <button onClick={() => handleChoice('SKIP')} disabled={isSubmitting} className="py-4 bg-bg-card border border-border text-text-primary rounded-2xl font-heading font-bold text-lg active:scale-95 transition-transform disabled:opacity-50">SKIP</button>
              </div>
            </motion.div>
          )}

          {gameState === 'result' && selectedScenario && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className={`p-8 rounded-3xl border-2 text-center space-y-4 ${
                resultOutcome?.isWin
                ? 'bg-accent-green/10 border-accent-green/30'
                : 'bg-accent-red/10 border-accent-red/30'
              }`}>
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-2">
                  {resultOutcome?.isWin ? (
                    <CheckCircle2 size={64} className="text-accent-green" />
                  ) : (
                    <AlertCircle size={64} className="text-accent-red" />
                  )}
                </div>
                
                <h2 className="text-2xl font-heading font-bold text-text-primary">
                  {resultOutcome?.isWin ? 'Smart Move!' : 'Tough Call'}
                </h2>
                
                <div className="space-y-1">
                  <p className="text-sm text-text-muted">Scenario outcome</p>
                  <p className={`text-xl font-heading font-extrabold ${resultOutcome?.isWin ? 'text-accent-green' : 'text-accent-red'}`}>
                    {resultOutcome?.result || 'No result available'}
                  </p>
                </div>
              </div>

              <div className="bg-bg-card border border-border rounded-3xl p-6 space-y-4">
                <h3 className="text-lg font-heading font-bold text-accent-gold">{selectedScenario.title}</h3>
                <p className="text-sm text-text-primary leading-relaxed">{resultOutcome?.result || 'Try another scenario to see the outcome.'}</p>
                <div className="p-4 bg-bg-secondary rounded-2xl border border-border">
                  <p className="text-[10px] font-bold text-accent-gold uppercase tracking-widest mb-2">💡 THE LESSON</p>
                  <p className="text-xs text-text-primary leading-relaxed font-bold">{resultOutcome?.lesson || 'Every market cycle teaches risk management and patience.'}</p>
                </div>
              </div>

              <button onClick={reset} className="w-full py-4 bg-bg-card border border-border text-text-primary rounded-2xl font-heading font-bold text-lg active:scale-95 transition-transform">
                Back to Scenarios
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
