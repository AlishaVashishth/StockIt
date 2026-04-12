import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion';
import { 
  ArrowLeft, 
  Star, 
  Plus, 
  Minus, 
  ChevronDown, 
  RefreshCw,
  Check,
  TrendingUp
} from 'lucide-react';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y'];

export default function StockDetail() {
  const { symbol = 'RELIANCE' } = useParams();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState('1D');
  const [isWatchlisted, setIsWatchlisted] = useState(true);
  const [quantity, setQuantity] = useState(5);
  const [buySell, setBuySell] = useState<'BUY' | 'SELL'>('BUY');
  const [showModal, setShowModal] = useState(false);
  const [orderType, setOrderType] = useState('Market');
  const [productType, setProductType] = useState<'CNC' | 'MIS'>('CNC');
  const [isRefreshingAI, setIsRefreshingAI] = useState(false);
  const [tooltipData, setTooltipData] = useState<Candle | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Price Animation
  const priceValue = useMotionValue(2813.60);
  const roundedPrice = useTransform(priceValue, (latest) => 
    latest.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );

  useEffect(() => {
    const controls = animate(priceValue, 2847.30, { duration: 1.5, ease: "easeOut" });
    return () => controls.stop();
  }, []);

  // Mock Data Generation
  const generateCandles = (count: number, startPrice: number): Candle[] => {
    let current = startPrice;
    return Array.from({ length: count }, () => {
      const open = current;
      const close = current + (Math.random() - 0.45) * 40;
      const high = Math.max(open, close) + Math.random() * 10;
      const low = Math.min(open, close) - Math.random() * 10;
      const volume = Math.random() * 5000000;
      current = close;
      return { open, high, low, close, volume };
    });
  };

  const candles = useMemo(() => generateCandles(25, 2800), [activeTab]);

  // Chart Drawing
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;
    const chartHeight = height - padding;
    const chartWidth = width - 60;

    // Clear
    ctx.fillStyle = '#0A0A0F';
    ctx.fillRect(0, 0, width, height);

    // Grid Lines
    ctx.strokeStyle = '#1A1A26';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();
    }

    // Find Min/Max
    const allPrices = candles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...allPrices) * 0.995;
    const maxPrice = Math.max(...allPrices) * 1.005;
    const priceRange = maxPrice - minPrice;

    const getX = (index: number) => (index / (candles.length - 1)) * chartWidth;
    const getY = (price: number) => chartHeight - ((price - minPrice) / priceRange) * chartHeight;

    // Y-Axis Labels
    ctx.fillStyle = '#6B6B8A';
    ctx.font = '9px "IBM Plex Mono"';
    for (let i = 0; i < 5; i++) {
      const price = maxPrice - (priceRange / 4) * i;
      ctx.fillText(`₹${Math.round(price)}`, chartWidth + 5, (chartHeight / 4) * i + 3);
    }

    // Volume Bars
    candles.forEach((candle, i) => {
      const x = getX(i);
      const barWidth = (chartWidth / candles.length) * 0.7;
      const volHeight = (candle.volume / 5000000) * 40;
      ctx.fillStyle = candle.close >= candle.open ? 'rgba(0, 212, 161, 0.2)' : 'rgba(255, 71, 87, 0.2)';
      ctx.fillRect(x - barWidth / 2, height - volHeight, barWidth, volHeight);
    });

    // Candles
    candles.forEach((candle, i) => {
      const x = getX(i);
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#00D4A1' : '#FF4757';
      const bodyColor = isGreen ? 'rgba(0, 212, 161, 0.2)' : 'rgba(255, 71, 87, 0.2)';

      // Wick
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, getY(candle.high));
      ctx.lineTo(x, getY(candle.low));
      ctx.stroke();

      // Body
      const bodyTop = getY(Math.max(candle.open, candle.close));
      const bodyBottom = getY(Math.min(candle.open, candle.close));
      const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
      const bodyWidth = (chartWidth / candles.length) * 0.6;

      ctx.fillStyle = bodyColor;
      ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
      ctx.strokeRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
    });

    // Moving Average
    ctx.strokeStyle = 'rgba(240, 165, 0, 0.5)';
    ctx.beginPath();
    candles.forEach((candle, i) => {
      const x = getX(i);
      const mid = (candle.open + candle.close) / 2;
      if (i === 0) ctx.moveTo(x, getY(mid));
      else ctx.lineTo(x, getY(mid));
    });
    ctx.stroke();
  };

  useEffect(() => {
    drawChart();
    window.addEventListener('resize', drawChart);
    return () => window.removeEventListener('resize', drawChart);
  }, [candles]);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    
    const chartWidth = rect.width - 60;
    const index = Math.round((x / chartWidth) * (candles.length - 1));
    
    if (index >= 0 && index < candles.length) {
      setTooltipData(candles[index]);
      setTooltipPos({ x, y: 50 });
    }
  };

  const handleRefreshAI = () => {
    setIsRefreshingAI(true);
    setTimeout(() => setIsRefreshingAI(false), 1000);
  };

  return (
    <div className="relative min-h-screen w-full bg-bg-primary flex flex-col overflow-x-hidden">
      {/* TOP BAR */}
      <header className="fixed top-0 left-0 right-0 max-w-[390px] mx-auto z-50 bg-bg-primary/90 backdrop-blur-md h-[60px] flex items-center justify-between px-4">
        <button onClick={() => navigate('/trade')} className="p-2 -ml-2 text-text-primary">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-mono font-bold text-text-primary uppercase tracking-wider">{symbol}</h1>
          <p className="text-[10px] text-text-muted font-mono">NSE</p>
        </div>
        <button onClick={() => setIsWatchlisted(!isWatchlisted)} className="p-2 -mr-2">
          <Star size={20} className={isWatchlisted ? "fill-accent-gold text-accent-gold" : "text-text-muted"} />
        </button>
      </header>

      {/* CONTENT */}
      <main className="flex-1 pt-[70px] pb-[300px] px-4 overflow-y-auto no-scrollbar">
        {/* PRICE HEADER */}
        <div className="mb-6">
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-heading font-bold text-text-primary">₹</span>
            <motion.span className="text-[44px] font-heading font-bold text-text-primary leading-none tracking-tight">
              {roundedPrice}
            </motion.span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm font-mono font-bold text-accent-green">+₹33.70 (+1.20%) ▲ Today</span>
          </div>
          <p className="text-[12px] text-text-muted mt-1">Reliance Industries Limited</p>
        </div>

        {/* CHART SECTION */}
        <div className="mb-8">
          <div className="flex justify-between border-b border-border mb-4">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setActiveTab(tf)}
                className={`pb-2 px-2 text-[12px] font-mono font-bold transition-all relative ${
                  activeTab === tf ? 'text-accent-gold' : 'text-text-muted'
                }`}
              >
                {tf}
                {activeTab === tf && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-gold" />
                )}
              </button>
            ))}
          </div>

          <div 
            className="relative h-[220px] w-full cursor-crosshair"
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onMouseLeave={() => setTooltipData(null)}
            onTouchEnd={() => setTooltipData(null)}
          >
            <canvas ref={canvasRef} className="w-full h-full" />
            
            {/* Tooltip */}
            <AnimatePresence>
              {tooltipData && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-0 left-0 right-0 pointer-events-none"
                >
                  <div className="bg-bg-card/90 backdrop-blur-sm border border-border p-2 rounded-lg shadow-xl flex justify-between items-center text-[10px] font-mono">
                    <div className="space-x-2">
                      <span className="text-text-muted">O: <span className="text-text-primary">₹{tooltipData.open.toFixed(0)}</span></span>
                      <span className="text-text-muted">H: <span className="text-text-primary">₹{tooltipData.high.toFixed(0)}</span></span>
                      <span className="text-text-muted">L: <span className="text-text-primary">₹{tooltipData.low.toFixed(0)}</span></span>
                      <span className="text-text-muted">C: <span className="text-text-primary">₹{tooltipData.close.toFixed(0)}</span></span>
                    </div>
                    <span className="text-text-muted">V: <span className="text-text-primary">{(tooltipData.volume / 1000000).toFixed(1)}M</span></span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* AI EXPLAINER CARD */}
        <div className="bg-bg-card border border-accent-gold/30 rounded-2xl p-4 mb-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🤖</span>
              <h3 className="text-sm font-heading font-bold text-text-primary">AI Insight</h3>
            </div>
            <span className="text-[10px] text-text-muted uppercase tracking-widest">Powered by Claude</span>
          </div>

          <div className="space-y-4 text-[13px] text-text-primary leading-relaxed">
            <p>Reliance Industries ek true conglomerate hai 🇮🇳</p>
            <p>Think of it as 3 massive businesses in one stock:</p>
            <ul className="space-y-1 pl-2">
              <li>🛢️ Oil refining (Jio fuel)</li>
              <li>📱 Telecom (Jio — 470M+ subscribers)</li>
              <li>🛍️ Retail (Reliance Fresh, Trends, JioMart)</li>
            </ul>
            <div className="bg-accent-green/5 p-3 rounded-xl border border-accent-green/20">
              <p className="font-bold text-accent-green mb-1">📈 Why it's up today:</p>
              <p>Jio announced 8% subscriber growth this quarter — beating analyst estimates.</p>
            </div>
            <p><span className="font-bold">⚖️ Risk Level:</span> <span className="text-accent-green">LOW–MEDIUM</span></p>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-[11px] text-text-muted mb-3">Investors like you also viewed:</p>
            <div className="flex flex-wrap gap-2">
              {['BHARTIARTL', 'IDEA', 'TATACOMM'].map(s => (
                <button 
                  key={s}
                  onClick={() => navigate(`/trade/${s}`)}
                  className="px-3 py-1.5 rounded-full bg-bg-secondary border border-border text-[10px] font-mono font-bold text-text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleRefreshAI}
            className="w-full mt-4 py-2 border border-border rounded-xl text-[11px] font-bold text-text-muted flex items-center justify-center space-x-2"
          >
            <RefreshCw size={12} className={isRefreshingAI ? "animate-spin" : ""} />
            <span>{isRefreshingAI ? "Analyzing..." : "Refresh Insight ↻"}</span>
          </button>
        </div>

        {/* YOUR POSITION */}
        <div className="bg-accent-green/[0.03] border border-accent-green/30 rounded-2xl p-4 mb-6">
          <p className="text-[11px] font-mono font-bold text-accent-green uppercase tracking-widest mb-3">Your Position in {symbol}</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-mono font-bold text-text-primary">8 shares</p>
              <p className="text-[11px] text-text-muted">Avg ₹2,801</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-mono font-bold text-accent-green">+₹368</p>
              <p className="text-[11px] font-mono text-accent-green">(+1.6%)</p>
            </div>
          </div>
        </div>
      </main>

      {/* ORDER PANEL */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[390px] mx-auto bg-bg-secondary border-t border-border rounded-t-[24px] p-6 z-[60] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {/* Buy/Sell Toggle */}
        <div className="flex bg-bg-primary p-1 rounded-xl mb-6">
          <button 
            onClick={() => setBuySell('BUY')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              buySell === 'BUY' ? 'bg-accent-green text-bg-primary' : 'text-text-muted'
            }`}
          >
            BUY
          </button>
          <button 
            onClick={() => setBuySell('SELL')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              buySell === 'SELL' ? 'bg-accent-red text-white' : 'text-text-muted'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Order Type & Quantity */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Order Type</span>
            <button className="flex items-center space-x-1 px-3 py-1.5 bg-bg-primary border border-border rounded-lg text-xs font-bold text-text-primary">
              <span>{orderType} Order</span>
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Quantity</span>
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full bg-bg-primary border border-border flex items-center justify-center text-text-primary"
              >
                <Minus size={16} />
              </button>
              <span className="text-2xl font-mono font-bold text-text-primary">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full bg-bg-primary border border-border flex items-center justify-center text-text-primary"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-bg-primary rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-text-muted">Market Price</span>
            <span className="text-text-primary font-mono">₹2,847.30</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-text-muted">Quantity</span>
            <span className="text-text-primary font-mono">× {quantity} shares</span>
          </div>
          <div className="h-[1px] bg-border my-2" />
          <div className="flex justify-between text-sm font-bold">
            <span className="text-text-primary">Total</span>
            <span className="text-text-primary font-mono">₹{(2847.30 * quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-[10px] pt-1">
            <span className="text-text-muted">Available Cash</span>
            <span className="text-text-primary">₹37,450.00</span>
          </div>
        </div>

        {/* Product Type */}
        <div className="flex space-x-3 mb-6">
          <button 
            onClick={() => setProductType('CNC')}
            className={`flex-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${
              productType === 'CNC' ? 'border-accent-gold bg-accent-gold/5 text-accent-gold' : 'border-border text-text-muted'
            }`}
          >
            CNC — Delivery 📦
          </button>
          <button 
            onClick={() => setProductType('MIS')}
            className={`flex-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${
              productType === 'MIS' ? 'border-accent-gold bg-accent-gold/5 text-accent-gold' : 'border-border text-text-muted'
            }`}
          >
            MIS — Intraday ⚡
          </button>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className={`w-full py-4 rounded-2xl font-heading font-bold text-lg shadow-lg transition-transform active:scale-95 ${
            buySell === 'BUY' ? 'bg-accent-green text-bg-primary' : 'bg-accent-red text-white'
          }`}
        >
          {buySell} {symbol}
        </button>
      </div>

      {/* ORDER CONFIRMATION MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-bg-primary/95 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-[320px] bg-bg-card border border-border rounded-[32px] p-8 text-center"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <motion.circle
                    cx="50" cy="50" r="45"
                    fill="none" stroke="#F0A500" strokeWidth="4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                </svg>
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Check size={48} className="text-accent-gold" />
                </motion.div>
              </div>

              <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">Order Placed!</h2>
              <p className="text-sm text-text-primary mb-1">Bought {quantity} shares of {symbol}</p>
              <p className="text-xs text-text-muted mb-8">₹{(2847.30 * quantity).toLocaleString('en-IN')} deducted</p>
              
              <div className="bg-bg-secondary p-3 rounded-xl mb-8">
                <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">New Portfolio Value</p>
                <p className="text-lg font-heading font-bold text-accent-gold">₹1,14,230</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/portfolio')}
                  className="w-full py-3.5 bg-accent-gold text-bg-primary rounded-xl font-bold"
                >
                  View Portfolio
                </button>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-full py-3.5 border border-border text-text-primary rounded-xl font-bold"
                >
                  Trade More
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
