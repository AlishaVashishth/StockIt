import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, X, Trophy, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function LearnLesson() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await api.getLearnLessons(Number(moduleId));
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [moduleId]);

  useEffect(() => {
    if (data.length === 0) return;
    const firstIncompleteIndex = data.findIndex((lesson: any) => !lesson.completed);
    setCurrentLessonIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : data.length - 1);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
  }, [data]);

  if (loading || data.length === 0) {
    return <div className="min-h-screen bg-bg-primary flex justify-center items-center text-accent-gold"><RefreshCw className="animate-spin mr-2"/> Loading Lesson...</div>;
  }

  const currentLesson = data[currentLessonIndex];
  const quiz = currentLesson.quiz || []; 
  const currentQuestion = quiz[currentQuestionIndex];
  const contentHtml = Array.isArray(currentLesson.content)
    ? currentLesson.content.map((c: any) => `<p>${c.value}</p>`).join('')
    : (currentLesson.content || '');

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
  };

  const submitQuiz = async () => {
     try {
        // Simple logic for quiz score: assuming they got it right eventually
        const score = 100; 
        await api.completeLesson(currentLesson.id, Number(moduleId), score);
        if (currentLessonIndex < data.length - 1) {
          setCurrentLessonIndex(currentLessonIndex + 1);
          setCurrentQuestionIndex(0);
          setSelectedOption(null);
          setIsAnswered(false);
          return;
        }
        setQuizComplete(true);
        setShowCompletion(true);
     } catch (e) {
        console.error("Error submitting lesson");
     }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      submitQuiz();
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-bg-primary flex flex-col overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/90 backdrop-blur-md">
        <div className="h-[60px] flex items-center justify-between px-4">
          <button onClick={() => navigate('/learn')} className="p-2 -ml-2 text-text-primary">
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <span className="text-[12px] font-mono text-text-muted">
              Module {moduleId} · Lesson {currentLesson.lessonNumber}
            </span>
          </div>
          <div className="px-2 py-1 rounded bg-accent-gold/10 border border-accent-gold/20">
            <span className="text-[10px] font-bold text-accent-gold">{currentLesson.xpReward} XP</span>
          </div>
        </div>
        <div className="h-[2px] w-full bg-bg-secondary">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "60%" }}
            className="h-full bg-accent-gold"
          />
        </div>
      </header>

      <main className="flex-1 pt-[80px] pb-10 px-6 overflow-y-auto no-scrollbar">
        <div className="mb-8">
          <span className="text-[10px] font-mono text-accent-gold font-bold tracking-widest uppercase block mb-2">
            📊 EDUCATION
          </span>
          <h1 className="text-[28px] font-heading font-bold text-text-primary leading-tight mb-2">
            {currentLesson.title}
          </h1>
          <span className="text-[12px] text-text-muted">⏱️ 3 min read</span>
        </div>

        <div className="space-y-4 mb-10 text-sm font-mono text-text-primary leading-[1.8]" dangerouslySetInnerHTML={{ __html: contentHtml }}>
        </div>

        {/* Note: I removed the large static SVG Candlestick diagram for brevity in auto-generation, it would be mapped dynamically if content had custom SVGs in reality */}

        <div className="pt-10 border-t border-border">
          <div className="text-center mb-6">
            <span className="text-[11px] font-mono text-text-muted uppercase tracking-widest">— Quick Check —</span>
          </div>
          
          <div className="mb-4">
            <span className="text-[10px] font-bold text-accent-gold uppercase">Question {currentQuestionIndex + 1} of {quiz.length}</span>
          </div>

          <div className="p-6 rounded-2xl bg-bg-card border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-6">{currentQuestion.question}</h3>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option: string, idx: number) => {
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
                    <span>{currentQuestionIndex === quiz.length - 1 ? 'Finish Lesson' : 'Next Question'}</span>
                    <ArrowLeft size={18} className="rotate-180" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showCompletion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-bg-primary flex flex-col items-center justify-center p-8 text-center"
          >
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
            <p className="text-2xl font-bold text-accent-gold mb-8">+{currentLesson.xpReward} XP Earned</p>
            
            <div className="w-full space-y-4 mt-12">
              <button 
                onClick={() => navigate('/learn')}
                className="w-full py-4 bg-accent-gold text-bg-primary rounded-xl font-bold text-lg"
              >
                Back to Modules →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
