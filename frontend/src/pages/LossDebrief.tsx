import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { 
  ArrowLeft, 
  Smartphone, 
  Pizza, 
  Film, 
  Plane, 
  Search, 
  Brain, 
  Lightbulb,
  CheckCircle2
} from 'lucide-react';

const REAL_LIFE_ITEMS = [
  { icon: <Smartphone className="text-accent-gold" />, text: "Almost a new Redmi Note 13 Pro", delay: 0.7 },
  { icon: <Pizza className="text-accent-gold" />, text: "184 meals at your college canteen", delay: 0.85 },
  { icon: <Film className="text-accent-gold" />, text: "92 movie tickets", delay: 1.0 },
  { icon: <Plane className="text-accent-gold" />, text: "A flight from Delhi to Goa", delay: 1.15 },
];

const LossCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, { 
      duration: 2, 
      delay: 0.5,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(latest)
    });
    return () => controls.stop();
  }, [value]);

  return <span className="text-accent-red">₹{Math.round(displayValue).toLocaleString('en-IN')}</span>;
};

export default function LossDebrief() {
  const navigate = useNavigate();
  const [lessonSaved, setLessonSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    setLessonSaved(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <motion.div 
      initial={{ y: 800 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 120 }}
      className="relative min-h-screen w-full bg-bg-primary flex flex-col overflow-x-hidden"
    >
      {/* Red particles effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-1.5 h-1.5 bg-accent-red/40 rounded-full animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* TOP SECTION */}
      <div className="relative pt-6 pb-12 px-4 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#FF475708_0%,transparent_70%)] pointer-events-none" />
        
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-4 flex items-center space-x-1 text-text-muted text-sm font-mono"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            delay: 0.3, 
            type: "spring",
            stiffness: 260,
            damping: 20 
          }}
          className="text-[64px] mb-4"
        >
          💥
        </motion.div>

        <p className="text-[10px] font-mono font-bold text-accent-red uppercase tracking-[0.2em] mb-2">
          PORTFOLIO HIT
        </p>
        
        <h1 className="text-[40px] font-heading font-bold text-text-primary leading-tight mb-1">
          You lost <LossCounter value={-9200} /> today
        </h1>
        
        <p className="text-base font-mono text-text-muted">in Yes Bank</p>
      </div>

      {/* CONTENT SCROLL AREA */}
      <div className="flex-1 px-4 space-y-8 pb-32">
        
        {/* REAL LIFE TRANSLATION */}
        <section>
          <h2 className="text-base font-heading font-bold text-accent-gold mb-4">In real life, ₹9,200 is...</h2>
          <div className="space-y-3">
            {REAL_LIFE_ITEMS.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: item.delay }}
                className="flex items-center space-x-4 bg-bg-card p-4 rounded-xl border border-border/50"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="text-sm font-mono text-text-primary">{item.text}</span>
              </motion.div>
            ))}
          </div>
          <p className="mt-4 text-[12px] font-mono text-text-muted italic text-center leading-relaxed">
            "We're not trying to scare you. We're making abstract numbers real — so they mean something."
          </p>
        </section>

        {/* WHAT HAPPENED */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.4 }}
          className="bg-[#4A9EFF10] border-l-4 border-[#4A9EFF] rounded-xl p-5"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Search size={18} className="text-[#4A9EFF]" />
            <h3 className="text-base font-heading font-bold text-[#4A9EFF]">What Happened?</h3>
          </div>
          <p className="text-[13px] font-mono text-text-primary leading-[1.8] mb-4">
            RBI placed Yes Bank under a moratorium in March 2020. Account holders were restricted from withdrawing more than ₹50,000.
            <br /><br />
            This is called <span className="text-[#4A9EFF] font-bold">REGULATORY RISK</span> — when a government body takes action that fundamentally changes a company's operations. No technical chart could have predicted this.
          </p>
          <div className="inline-block px-3 py-1 bg-accent-gold/15 rounded-full">
            <span className="text-[10px] font-mono font-bold text-accent-gold uppercase tracking-wider">📚 Concept: Regulatory Risk</span>
          </div>
        </motion.div>

        {/* WHAT SMART INVESTORS WOULD DO */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.7 }}
          className="bg-bg-card/50 border-l-4 border-[#A855F7] rounded-xl p-5"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Brain size={18} className="text-[#A855F7]" />
            <h3 className="text-base font-heading font-bold text-[#A855F7]">What a Pro Would Have Done</h3>
          </div>
          <p className="text-[13px] font-mono text-text-primary leading-[1.8] mb-4">
            Rakesh Jhunjhunwala — India's greatest retail investor — had a strict rule: never hold more than 10% of his portfolio in any single stock.
            <br /><br />
            You had 45% of your virtual portfolio in Yes Bank. This is <span className="text-[#A855F7] font-bold">CONCENTRATION RISK</span>.
          </p>
          <div className="inline-block px-3 py-1 bg-accent-gold/15 rounded-full">
            <span className="text-[10px] font-mono font-bold text-accent-gold uppercase tracking-wider">📚 Concept: Diversification</span>
          </div>
        </motion.div>

        {/* THE LESSON */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 2.0 }}
          className="bg-accent-gold/15 border border-accent-gold/60 rounded-2xl p-6"
        >
          <p className="text-[11px] font-mono font-bold text-accent-gold uppercase tracking-widest mb-2">💡 Lesson #7</p>
          <h4 className="text-[22px] font-heading font-bold text-text-primary mb-3 leading-tight">
            Diversification isn't just advice. It's armour.
          </h4>
          <p className="text-sm font-mono text-text-muted leading-relaxed">
            No single company should be able to break your portfolio. Spread the risk. Sleep better at night.
          </p>
        </motion.div>

        {/* XP REWARD */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 2.3 }}
          className="text-center py-8"
        >
          <h5 className="text-[32px] font-heading font-bold text-accent-gold mb-1">+50 XP Earned</h5>
          <p className="text-xs font-mono text-text-muted mb-6">For learning from this loss</p>
          
          <p className="text-[12px] font-mono text-text-muted italic leading-relaxed max-w-[280px] mx-auto mb-8">
            "At InvestSim, losing teaches you more than winning. Every loss you understand is a lesson your future real portfolio never has to learn."
          </p>

          <div className="max-w-[240px] mx-auto">
            <div className="flex justify-between text-[10px] font-mono text-text-muted mb-2">
              <span>340 XP</span>
              <span>390 XP</span>
            </div>
            <div className="h-2 w-full bg-bg-secondary rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: '68%' }}
                whileInView={{ width: '78%' }}
                viewport={{ once: true }}
                transition={{ delay: 2.5, duration: 1 }}
                className="h-full bg-accent-gold"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[390px] mx-auto p-4 bg-bg-primary/90 backdrop-blur-md border-t border-border z-50">
        <div className="space-y-3">
          <button 
            onClick={handleSave}
            className={`w-full py-4 rounded-2xl font-heading font-bold text-base flex items-center justify-center space-x-2 transition-all ${
              lessonSaved ? 'bg-accent-green text-bg-primary' : 'bg-accent-gold text-bg-primary'
            }`}
          >
            {lessonSaved ? <CheckCircle2 size={20} /> : <span>📌</span>}
            <span>{lessonSaved ? "Lesson Saved" : "Save This Lesson"}</span>
          </button>
          
          <button 
            onClick={() => navigate('/trade')}
            className="w-full py-4 rounded-2xl font-heading font-bold text-base border border-border text-text-primary hover:bg-bg-secondary transition-all"
          >
            I Understand — Keep Trading
          </button>
          
          <p className="text-[11px] font-mono text-text-muted text-center">
            Real loss: ₹0  |  Real lesson: <span className="text-text-primary">Priceless</span>
          </p>
        </div>
      </div>

      {/* TOAST */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] bg-accent-green text-bg-primary px-6 py-3 rounded-full font-bold text-sm shadow-xl"
          >
            Lesson saved to your Library ✅
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
