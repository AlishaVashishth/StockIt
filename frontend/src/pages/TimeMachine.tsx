import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  ArrowLeft, 
  Play, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';

interface Scenario {
  id: string;
  title: string;
  date: string;
  description: string;
  stock: string;
  priceAtTime: number;
  context: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  reward: number;
  outcome: {
    title: string;
    text: string;
    priceChange: string;
    isPositive: boolean;
    lesson: string;
  };
}

const SCENARIOS: Scenario[] = [
  {
    id: 'covid-2020',
    title: 'The Great Lockdown',
    date: 'March 23, 2020',
    description: 'The market has crashed 40% in a month. Everyone is panicking. Reliance is at a multi-year low.',
    stock: 'RELIANCE',
    priceAtTime: 884,
    context: 'The world is shutting down. Oil prices are negative. Experts say the market will go to zero.',
    difficulty: 'Hard',
    reward: 150,
    outcome: {
      title: 'The V-Shaped Recovery',
      text: 'Reliance announced the Jio-Facebook deal shortly after. The stock doubled in 3 months.',
      priceChange: '+112%',
      isPositive: true,
      lesson: 'Be greedy when others are fearful. Quality companies survive crises.'
    }
  },
  {
    id: 'yes-bank-2020',
    title: 'The Banking Crisis',
    date: 'March 5, 2020',
    description: 'Yes Bank is facing a moratorium. The stock is falling 10% every hour.',
    stock: 'YESBANK',
    priceAtTime: 36,
    context: 'RBI has taken control. There are rumors of a bailout, but also rumors of a total wipeout.',
    difficulty: 'Medium',
    reward: 100,
    outcome: {
      title: 'The Long Slide',
      text: 'The stock eventually hit ₹12. Investors who "bought the dip" lost almost everything.',
      priceChange: '-66%',
      isPositive: false,
      lesson: 'Don\'t catch a falling knife. Regulatory risk is real and unpredictable.'
    }
  },
  {
    id: 'zomato-ipo',
    title: 'The Tech Hype',
    date: 'July 2021',
    description: 'Zomato is the first big Indian tech IPO. The hype is massive. Valuation is sky-high.',
    stock: 'ZOMATO',
    priceAtTime: 125,
    context: 'New-age tech is the future. Profitability doesn\'t matter, only growth does.',
    difficulty: 'Medium',
    reward: 120,
    outcome: {
      title: 'The Reality Check',
      text: 'After a brief rally to ₹160, the stock crashed to ₹40 as global liquidity dried up.',
      priceChange: '-68%',
      isPositive: false,
      lesson: 'Valuation matters. Hype is not a business model.'
    }
  }
];

export default function TimeMachine() {
  const navigate = useNavigate();
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [gameState, setGameState] = useState<'browsing' | 'playing' | 'result'>('browsing');
  const [userChoice, setUserChoice] = useState<'BUY' | 'SKIP' | null>(null);

  const handleStartScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setGameState('playing');
  };

  const handleChoice = (choice: 'BUY' | 'SKIP') => {
    setUserChoice(choice);
    setGameState('result');
  };

  const reset = () => {
    setSelectedScenario(null);
    setGameState('browsing');
    setUserChoice(null);
  };

  return (
    <div className="relative min-h-screen w-full bg-bg-primary flex flex-col font-mono text-text-primary overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border h-[60px] flex items-center px-4">
        {gameState !== 'browsing' ? (
          <button onClick={reset} className="mr-3 p-1">
            <ArrowLeft size={20} />
          </button>
        ) : null}
        <h1 className="text-xl font-heading font-bold flex items-center">
          <History className="mr-2 text-accent-gold" size={20} />
          Time Machine
        </h1>
      </header>

      <main className="flex-1 pt-[80px] pb-[100px] px-4">
        <AnimatePresence mode="wait">
          {gameState === 'browsing' && (
            <motion.div
              key="browsing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 blur-3xl rounded-full -mr-16 -mt-16" />
                <h2 className="text-lg font-heading font-bold text-accent-gold mb-2">Relive History</h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  Travel back to critical market moments. Make the call. See if you have what it takes to survive the past.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-heading font-bold uppercase tracking-widest text-text-muted">Available Scenarios</h3>
                {SCENARIOS.map((scenario) => (
                  <motion.button
                    key={scenario.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStartScenario(scenario)}
                    className="w-full bg-bg-card border border-border rounded-2xl p-4 text-left flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-bg-secondary rounded border border-border text-text-muted">
                          {scenario.date}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          scenario.difficulty === 'Easy' ? 'bg-accent-green/10 border-accent-green/30 text-accent-green' :
                          scenario.difficulty === 'Medium' ? 'bg-accent-gold/10 border-accent-gold/30 text-accent-gold' :
                          'bg-accent-red/10 border-accent-red/30 text-accent-red'
                        }`}>
                          {scenario.difficulty}
                        </span>
                      </div>
                      <h4 className="text-base font-heading font-bold text-text-primary group-hover:text-accent-gold transition-colors">
                        {scenario.title}
                      </h4>
                      <p className="text-[11px] text-text-muted mt-1 line-clamp-1">{scenario.description}</p>
                    </div>
                    <ChevronRight size={20} className="text-text-muted group-hover:text-accent-gold transition-colors ml-4" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {gameState === 'playing' && selectedScenario && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-6"
            >
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
                    <p className="text-xl font-heading font-bold text-text-primary">₹{selectedScenario.priceAtTime}</p>
                  </div>
                </div>

                <div className="p-4 bg-bg-secondary rounded-2xl border border-border">
                  <p className="text-sm leading-relaxed text-text-primary italic">
                    "{selectedScenario.description}"
                  </p>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-accent-blue/5 rounded-2xl border border-accent-blue/20">
                  <Info size={18} className="text-accent-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-accent-blue uppercase tracking-wider mb-1">Market Context</p>
                    <p className="text-[11px] text-text-primary leading-relaxed">
                      {selectedScenario.context}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => handleChoice('BUY')}
                  className="py-4 bg-accent-green text-bg-primary rounded-2xl font-heading font-bold text-lg shadow-[0_4px_20px_rgba(0,212,161,0.2)] active:scale-95 transition-transform"
                >
                  BUY
                </button>
                <button
                  onClick={() => handleChoice('SKIP')}
                  className="py-4 bg-bg-card border border-border text-text-primary rounded-2xl font-heading font-bold text-lg active:scale-95 transition-transform"
                >
                  SKIP
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'result' && selectedScenario && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className={`p-8 rounded-3xl border-2 text-center space-y-4 ${
                (userChoice === 'BUY' && selectedScenario.outcome.isPositive) || (userChoice === 'SKIP' && !selectedScenario.outcome.isPositive)
                ? 'bg-accent-green/10 border-accent-green/30'
                : 'bg-accent-red/10 border-accent-red/30'
              }`}>
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-2">
                  {(userChoice === 'BUY' && selectedScenario.outcome.isPositive) || (userChoice === 'SKIP' && !selectedScenario.outcome.isPositive) ? (
                    <CheckCircle2 size={64} className="text-accent-green" />
                  ) : (
                    <AlertCircle size={64} className="text-accent-red" />
                  )}
                </div>
                
                <h2 className="text-2xl font-heading font-bold text-text-primary">
                  {(userChoice === 'BUY' && selectedScenario.outcome.isPositive) || (userChoice === 'SKIP' && !selectedScenario.outcome.isPositive) 
                    ? 'Smart Move!' 
                    : 'Ouch...'}
                </h2>
                
                <div className="space-y-1">
                  <p className="text-sm text-text-muted">The stock went</p>
                  <p className={`text-4xl font-heading font-extrabold ${selectedScenario.outcome.isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                    {selectedScenario.outcome.priceChange}
                  </p>
                </div>
              </div>

              <div className="bg-bg-card border border-border rounded-3xl p-6 space-y-4">
                <h3 className="text-lg font-heading font-bold text-accent-gold">{selectedScenario.outcome.title}</h3>
                <p className="text-sm text-text-primary leading-relaxed">
                  {selectedScenario.outcome.text}
                </p>
                
                <div className="p-4 bg-bg-secondary rounded-2xl border border-border">
                  <p className="text-[10px] font-bold text-accent-gold uppercase tracking-widest mb-2">💡 THE LESSON</p>
                  <p className="text-xs text-text-primary leading-relaxed font-bold">
                    {selectedScenario.outcome.lesson}
                  </p>
                </div>
              </div>

              <div className="bg-accent-gold/10 border border-accent-gold/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-accent-gold flex items-center justify-center text-bg-primary">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-accent-gold uppercase tracking-widest">Reward</p>
                    <p className="text-sm font-bold text-text-primary">+{selectedScenario.reward} XP Earned</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-text-muted uppercase mb-1">New Total</p>
                  <p className="text-sm font-bold text-accent-gold">425 XP</p>
                </div>
              </div>

              <button
                onClick={reset}
                className="w-full py-4 bg-bg-card border border-border text-text-primary rounded-2xl font-heading font-bold text-lg active:scale-95 transition-transform"
              >
                Back to Scenarios
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
