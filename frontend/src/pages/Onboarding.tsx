import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useSpring, useTransform, animate } from 'motion/react';
import { Check } from 'lucide-react';
import { api } from '../api';

interface SelectionCardProps {
  id: string;
  title: string;
  subtext: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  key?: string;
}

function SelectionCard({ id, title, subtext, isSelected, onSelect }: SelectionCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(id)}
      className={`relative w-full p-5 rounded-2xl border text-left transition-all duration-300 mb-4 ${
        isSelected 
          ? 'bg-accent-gold/10 border-accent-gold ring-1 ring-accent-gold' 
          : 'bg-bg-card border-border hover:border-text-muted'
      }`}
    >
      <div className="flex flex-col">
        <span className="text-lg font-bold text-text-primary mb-1">{title}</span>
        <span className="text-sm text-text-muted font-mono">{subtext}</span>
      </div>
      {isSelected && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 w-6 h-6 bg-accent-gold rounded-full flex items-center justify-center"
        >
          <Check size={14} className="text-bg-primary stroke-[3]" />
        </motion.div>
      )}
    </motion.button>
  );
}

function Counter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1,
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
      ease: "easeOut"
    });
    return () => controls.stop();
  }, [value]);

  return <span>₹{displayValue.toLocaleString('en-IN')}</span>;
}

export default function Onboarding() {
  const USER_EMAIL_STORAGE_KEY = 'investsim_user_email';
  const USER_PROFILE_CACHE_KEY = 'stockit_user_profile_cache';
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [experience, setExperience] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      const trimmedName = name.trim();
      setInitError(null);
      localStorage.setItem(USER_EMAIL_STORAGE_KEY, email.trim());
      
      (async () => {
        try {
          const user = await api.startSession(trimmedName, email.trim(), password);
          localStorage.setItem(
            USER_PROFILE_CACHE_KEY,
            JSON.stringify({
              name: user?.name || trimmedName,
              email: user?.email || email.trim(),
              currentTier: user?.currentTier,
              xpPoints: user?.xpPoints,
              streakCount: user?.streakCount,
              daysActive: user?.daysActive
            })
          );
          setIsNewUser(user.isNewUser);
          setIsCreating(true);
          setTimeout(() => {
            navigate('/home');
          }, 3000);
        } catch (error: any) {
          console.error('Failed to initialize session:', error);
          setInitError(error.message || 'Could not access account. Please ensure backend is running or check credentials.');
          setIsCreating(false);
        }
      })();
    }
  };

  const experienceOptions = [
    { id: 'beginner', title: '🧑🎓 Complete Beginner', subtext: 'Never bought a stock in my life' },
    { id: 'heard', title: '📱 Heard About It', subtext: 'I use apps like Groww but don\'t fully understand' },
    { id: 'experienced', title: '📈 Some Experience', subtext: 'I\'ve invested before but want to practice more' },
  ];

  const goalOptions = [
    { id: 'basics', title: '📚 Learn the Basics', subtext: 'I want to understand how markets work' },
    { id: 'practice', title: '🎯 Practice Trading', subtext: 'I want to get good before using real money' },
    { id: 'beat', title: '🏆 Beat the Market', subtext: 'I want to compete and build real skill' },
  ];

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isStrongPassword = (pass: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pass);

  const hasValidEmail = !email || isValidEmail(email);
  const hasStrongPassword = !password || isStrongPassword(password);

  const isNextDisabled = 
    (step === 1 && !experience) || 
    (step === 2 && !goal) || 
    (step === 3 && (!name.trim() || !email.trim() || !isValidEmail(email) || !password || !isStrongPassword(password) || password !== confirmPassword));

  return (
    <div className="relative h-screen w-full bg-bg-primary flex flex-col overflow-hidden">
      {/* Step Indicator */}
      <div className="flex justify-center items-center space-x-3 py-10">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{
              width: step === i ? 24 : 8,
              height: 8,
              backgroundColor: i <= step ? '#F0A500' : '#2A2A3E'
            }}
            className="rounded-full"
          />
        ))}
      </div>

      <div className="flex-1 px-6 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full flex flex-col"
          >
            {step === 1 && (
              <div className="flex-1">
                <h1 className="text-[28px] font-heading font-bold text-text-primary leading-tight mb-2">
                  Have you invested before?
                </h1>
                <p className="text-sm font-mono text-text-muted mb-10">
                  No judgment. We start from where you are.
                </p>
                <div className="space-y-2">
                  {experienceOptions.map((opt) => (
                    <SelectionCard
                      key={opt.id}
                      id={opt.id}
                      title={opt.title}
                      subtext={opt.subtext}
                      isSelected={experience === opt.id}
                      onSelect={setExperience}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex-1">
                <h1 className="text-[28px] font-heading font-bold text-text-primary leading-tight mb-2">
                  What's your goal?
                </h1>
                <p className="text-sm font-mono text-text-muted mb-10">
                  This shapes your mission roadmap.
                </p>
                <div className="space-y-2">
                  {goalOptions.map((opt) => (
                    <SelectionCard
                      key={opt.id}
                      id={opt.id}
                      title={opt.title}
                      subtext={opt.subtext}
                      isSelected={goal === opt.id}
                      onSelect={setGoal}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex-1">
                <h1 className="text-[28px] font-heading font-bold text-text-primary leading-tight mb-2">
                  What should we call you?
                </h1>
                <p className="text-sm font-mono text-text-muted mb-10">
                  Your StockIt identity
                </p>
                
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name (e.g. Alisha)"
                    className="w-full h-14 bg-bg-card border border-border rounded-xl px-4 text-lg font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-gold transition-colors"
                    autoFocus
                  />
                  <motion.div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-gold scale-x-0 focus-within:scale-x-100 transition-transform origin-left" />
                </div>
                
                <div className="relative mb-6">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full h-14 bg-bg-card border border-border rounded-xl px-4 text-lg font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-gold transition-colors"
                  />
                  <motion.div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-gold scale-x-0 focus-within:scale-x-100 transition-transform origin-left" />
                  {!hasValidEmail && (
                    <p className="absolute -bottom-5 left-2 text-xs font-mono text-accent-red">Invalid email format</p>
                  )}
                </div>

                <div className="relative mb-6">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full h-14 bg-bg-card border border-border rounded-xl px-4 text-lg font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-gold transition-colors"
                  />
                  <motion.div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-gold scale-x-0 focus-within:scale-x-100 transition-transform origin-left" />
                  {!hasStrongPassword && (
                    <p className="absolute -bottom-5 left-2 text-xs font-mono text-accent-red">Must be 8+ chars (upper, lower, num, special)</p>
                  )}
                </div>

                <div className="relative mb-8">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full h-14 bg-bg-card border border-border rounded-xl px-4 text-lg font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-gold transition-colors"
                  />
                  <motion.div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-gold scale-x-0 focus-within:scale-x-100 transition-transform origin-left" />
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="absolute -bottom-6 left-2 text-xs font-mono text-accent-red">Passwords do not match</p>
                  )}
                </div>
                {initError && (
                  <p className="text-xs font-mono text-accent-red mb-4">{initError}</p>
                )}

                <div className="text-center space-y-2">
                  <p className="text-xs font-mono text-text-muted uppercase tracking-wider">
                    Your virtual account will start with
                  </p>
                  <h2 className="text-[40px] font-heading font-bold text-accent-gold">
                    ₹1,00,000
                  </h2>
                  <p className="text-xs font-mono text-text-muted">
                    100% fake. 100% real experience.
                  </p>
                </div>
              </div>
            )}

            <div className="pb-10 pt-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={isNextDisabled}
                onClick={handleNext}
                className={`w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center transition-all ${
                  isNextDisabled 
                    ? 'bg-accent-gold/40 text-bg-primary/50 cursor-not-allowed' 
                    : 'bg-accent-gold text-bg-primary shadow-[0_4px_20px_rgba(240,165,0,0.3)]'
                }`}
              >
                {step === 3 ? 'Start Trading →' : 'Continue →'}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Account Creation Overlay */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-bg-primary/95 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 border-2 border-accent-gold rounded-full"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <Check size={48} className="text-accent-gold stroke-[3]" />
                </motion.div>
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-2xl font-heading font-bold text-text-primary mb-2"
              >
                {isNewUser ? 'Account Created!' : `Welcome Back, ${name.trim()}!`}
              </motion.h2>
              
              {isNewUser && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="space-y-1"
                >
                  <p className="text-accent-green font-bold text-lg">
                    <Counter value={100000} />
                  </p>
                  <p className="text-sm text-text-muted font-mono">
                    deposited to your account
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
