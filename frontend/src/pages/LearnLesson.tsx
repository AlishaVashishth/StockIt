import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, X, Trophy } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const LESSON_DATA = {
  "2": {
    module: 2,
    lessonNumber: 3,
    totalLessons: 5,
    xpReward: 75,
    tag: "📊 READING CHARTS",
    title: "What is a Candlestick?",
    time: "3 min read",
    questions: [
      {
        id: 1,
        text: "A green candlestick means:",
        options: [
          "The stock price went up during this period",
          "The company made a profit today",
          "More people are selling than buying",
          "The stock hit its all-time high"
        ],
        correctIndex: 0,
        explanation: "Correct! Green = price went up."
      },
      {
        id: 2,
        text: "What do the thin lines above and below a candle body represent?",
        options: [
          "Trading volume",
          "The high and low prices of the day",
          "The opening and closing prices",
          "Dividends paid"
        ],
        correctIndex: 1,
        explanation: "Correct! These are called 'wicks' or 'shadows'."
      }
    ]
  }
};

export default function LearnLesson() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const data = LESSON_DATA[moduleId as keyof typeof LESSON_DATA] || LESSON_DATA["2"];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const currentQuestion = data.questions[currentQuestionIndex];

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < data.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizComplete(true);
      setShowCompletion(true);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-bg-primary flex flex-col overflow-x-hidden">
      {/* TOP BAR */}
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/90 backdrop-blur-md">
        <div className="h-[60px] flex items-center justify-between px-4">
          <button onClick={() => navigate('/learn')} className="p-2 -ml-2 text-text-primary">
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <span className="text-[12px] font-mono text-text-muted">
              Module {data.module} · Lesson {data.lessonNumber} of {data.totalLessons}
            </span>
          </div>
          <div className="px-2 py-1 rounded bg-accent-gold/10 border border-accent-gold/20">
            <span className="text-[10px] font-bold text-accent-gold">{data.xpReward} XP</span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-[2px] w-full bg-bg-secondary">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "60%" }}
            className="h-full bg-accent-gold"
          />
        </div>
      </header>

      {/* SCROLLABLE CONTENT */}
      <main className="flex-1 pt-[80px] pb-10 px-6 overflow-y-auto no-scrollbar">
        {/* HEADER */}
        <div className="mb-8">
          <span className="text-[10px] font-mono text-accent-gold font-bold tracking-widest uppercase block mb-2">
            {data.tag}
          </span>
          <h1 className="text-[28px] font-heading font-bold text-text-primary leading-tight mb-2">
            {data.title}
          </h1>
          <span className="text-[12px] text-text-muted">⏱️ {data.time}</span>
        </div>

        {/* SECTION 1: Intro */}
        <div className="space-y-4 mb-10">
          <p className="text-sm font-mono text-text-primary leading-[1.8]">
            Every day in the stock market, a battle happens between buyers and sellers. 
            A candlestick is the scoreboard of that battle — for one specific time period.
          </p>
          <p className="text-sm font-mono text-text-primary leading-[1.8]">
            Each candle tells you 4 things: the opening price, the closing price, 
            the highest price reached, and the lowest price reached.
          </p>
        </div>

        {/* SECTION 2: Candlestick Diagram */}
        <div className="mb-12">
          <svg width="100%" height="240" viewBox="0 0 350 240" className="overflow-visible">
            {/* Bullish Candle (Green) */}
            <g transform="translate(60, 20)">
              {/* Wick */}
              <motion.line 
                x1="30" y1="10" x2="30" y2="170" 
                stroke="#00D4A1" strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
              />
              {/* Body */}
              <motion.rect 
                x="15" y="40" width="30" height="100" 
                fill="rgba(0, 212, 161, 0.2)" stroke="#00D4A1" strokeWidth="2" rx="2"
                initial={{ height: 0, y: 140 }}
                whileInView={{ height: 100, y: 40 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              {/* Labels */}
              <text x="65" y="15" className="text-[11px] font-mono fill-text-muted">HIGH</text>
              <text x="65" y="45" className="text-[11px] font-mono fill-text-muted">CLOSE</text>
              <text x="65" y="145" className="text-[11px] font-mono fill-text-muted">OPEN</text>
              <text x="65" y="175" className="text-[11px] font-mono fill-text-muted">LOW</text>
              
              <text x="30" y="200" textAnchor="middle" className="text-[10px] font-bold fill-accent-green">GREEN = Bullish</text>
              <text x="30" y="215" textAnchor="middle" className="text-[9px] fill-text-muted">(Price went UP)</text>
            </g>

            {/* Bearish Candle (Red) */}
            <g transform="translate(200, 20)">
              {/* Wick */}
              <motion.line 
                x1="30" y1="10" x2="30" y2="170" 
                stroke="#FF4757" strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
              />
              {/* Body */}
              <motion.rect 
                x="15" y="40" width="30" height="100" 
                fill="rgba(255, 71, 87, 0.2)" stroke="#FF4757" strokeWidth="2" rx="2"
                initial={{ height: 0, y: 40 }}
                whileInView={{ height: 100, y: 40 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              {/* Labels */}
              <text x="65" y="15" className="text-[11px] font-mono fill-text-muted">HIGH</text>
              <text x="65" y="45" className="text-[11px] font-mono fill-text-muted">OPEN</text>
              <text x="65" y="145" className="text-[11px] font-mono fill-text-muted">CLOSE</text>
              <text x="65" y="175" className="text-[11px] font-mono fill-text-muted">LOW</text>

              <text x="30" y="200" textAnchor="middle" className="text-[10px] font-bold fill-accent-red">RED = Bearish</text>
              <text x="30" y="215" textAnchor="middle" className="text-[9px] fill-text-muted">(Price went DOWN)</text>
            </g>
          </svg>
        </div>

        {/* SECTION 3: Key Insight */}
        <div className="p-4 rounded-xl bg-accent-gold/10 border-l-[3px] border-accent-gold mb-10">
          <h4 className="text-sm font-bold text-accent-gold mb-2">💡 Key Insight</h4>
          <p className="text-xs text-text-primary leading-relaxed">
            The longer the candle body, the stronger the move. 
            A tiny body = buyers and sellers were equal. 
            A huge body = one side completely dominated.
          </p>
        </div>

        {/* SECTION 4: Case Study */}
        <div className="p-4 rounded-xl bg-accent-blue/10 border-l-[3px] border-accent-blue mb-10">
          <h4 className="text-sm font-bold text-accent-blue mb-2">📊 Real Indian Market: March 23, 2020</h4>
          <p className="text-xs text-text-primary leading-relaxed mb-4">
            On this day, NIFTY 50 formed the largest red candle in Indian market history — 
            a single candle representing a 13% crash. It was COVID's market verdict.
          </p>
          <p className="text-xs text-text-primary leading-relaxed mb-4">
            Smart investors who saw this as a 'maximum fear moment' and bought 
            index funds that day made 2.5x returns by October 2021.
          </p>
          {/* Small V-Recovery SVG */}
          <div className="h-10 w-32">
            <svg width="100%" height="100%" viewBox="0 0 100 40">
              <motion.path 
                d="M 0 5 L 40 35 L 100 0" 
                fill="none" stroke="#4A9EFF" strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 1 }}
              />
            </svg>
          </div>
        </div>

        {/* SECTION 5: Transition */}
        <p className="text-sm font-mono text-text-primary leading-[1.8] mb-12">
          Now that you understand a single candle, let's look at patterns — 
          what multiple candles together tell you about market direction.
        </p>

        {/* QUIZ SECTION */}
        <div className="pt-10 border-t border-border">
          <div className="text-center mb-6">
            <span className="text-[11px] font-mono text-text-muted uppercase tracking-widest">— Quick Check —</span>
          </div>
          
          <div className="mb-4">
            <span className="text-[10px] font-bold text-accent-gold uppercase">Question {currentQuestionIndex + 1} of {data.questions.length}</span>
          </div>

          <div className="p-6 rounded-2xl bg-bg-card border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-6">{currentQuestion.text}</h3>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isCorrect = idx === currentQuestion.correctIndex;
                const isSelected = selectedOption === idx;
                
                let borderColor = 'border-border';
                let bgColor = 'bg-bg-secondary/50';
                
                if (isAnswered) {
                  if (isCorrect) {
                    borderColor = 'border-accent-green';
                    bgColor = 'bg-accent-green/10';
                  } else if (isSelected) {
                    borderColor = 'border-accent-red';
                    bgColor = 'bg-accent-red/10';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${borderColor} ${bgColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-text-primary">{option}</span>
                      {isAnswered && isCorrect && <Check size={16} className="text-accent-green" />}
                      {isAnswered && isSelected && !isCorrect && <X size={16} className="text-accent-red" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {isAnswered && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 pt-6 border-t border-border"
                >
                  <p className={`text-sm font-bold mb-4 ${selectedOption === currentQuestion.correctIndex ? 'text-accent-green' : 'text-accent-red'}`}>
                    {currentQuestion.explanation}
                  </p>
                  <button 
                    onClick={handleNext}
                    className="w-full py-4 bg-accent-gold text-bg-primary rounded-xl font-bold flex items-center justify-center space-x-2"
                  >
                    <span>{currentQuestionIndex === data.questions.length - 1 ? 'Finish Lesson' : 'Next Question'}</span>
                    <ArrowLeft size={18} className="rotate-180" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* COMPLETION OVERLAY */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-bg-primary flex flex-col items-center justify-center p-8 text-center"
          >
            {/* Confetti Placeholder (CSS) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -20, x: Math.random() * 390, opacity: 1 }}
                  animate={{ y: 800, rotate: 360 }}
                  transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: "linear" }}
                  className="absolute w-2 h-2 rounded-full bg-accent-gold"
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="w-24 h-24 bg-accent-gold/20 rounded-full flex items-center justify-center mb-8"
            >
              <Trophy size={48} className="text-accent-gold" />
            </motion.div>

            <h2 className="text-3xl font-heading font-bold text-text-primary mb-2">Lesson Complete!</h2>
            <p className="text-2xl font-bold text-accent-gold mb-8">+{data.xpReward} XP Earned</p>
            
            <div className="bg-bg-card border border-border p-4 rounded-xl mb-12 w-full">
              <p className="text-sm text-text-muted">Progress Update</p>
              <p className="text-lg font-bold text-text-primary">3 of 5 lessons done in Module 2</p>
            </div>

            <div className="w-full space-y-4">
              <button 
                onClick={() => navigate('/learn')}
                className="w-full py-4 bg-accent-gold text-bg-primary rounded-xl font-bold text-lg"
              >
                Next Lesson →
              </button>
              <button 
                onClick={() => navigate('/learn')}
                className="w-full py-4 border border-border text-text-primary rounded-xl font-bold text-lg"
              >
                Back to Learn
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
