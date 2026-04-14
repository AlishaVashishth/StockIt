import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion';
import { 
  ArrowLeft, Star, Plus, Minus, ChevronDown, RefreshCw, Check
} from 'lucide-react';
import { api } from '../api';

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y'];

const MENTOR_PLACEHOLDER = 'Market data is loading. Please try again.';

function isMentorPlaceholderText(text: string | undefined | null): boolean {
  const t = String(text || '').trim();
  return !t || t === MENTOR_PLACEHOLDER;
}

function sentencesToBullets(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
}

/** Lines that look like markdown / numbered bullets */
function lineLooksLikeBullet(line: string): boolean {
  const l = line.trim();
  return (
    /^[-*•]\s+\S/.test(l) ||
    /^\d+[\).]\s+\S/.test(l) ||
    /^(Trend|Recommendation|Why not|Why|Risk):/i.test(l)
  );
}

export default function StockDetail() {
  const { symbol = 'RELIANCE' } = useParams();
  const navigate = useNavigate();
  
  const [stockDetail, setStockDetail] = useState<any>(null);
  const [candles, setCandles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('1D');
  const [isWatchlisted, setIsWatchlisted] = useState(true);
  const [quantity, setQuantity] = useState(5);
  const [buySell, setBuySell] = useState<'BUY' | 'SELL'>('BUY');
  const [showModal, setShowModal] = useState(false);
  const [orderType, setOrderType] = useState('Market');
  const [productType, setProductType] = useState<'CNC' | 'MIS'>('CNC');
  const [isRefreshingAI, setIsRefreshingAI] = useState(false);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showDetailedInsight, setShowDetailedInsight] = useState(false);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [cash, setCash] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadData = async () => {
    try {
      const [detailRes, historyRes, dashRes] = await Promise.all([
        api.getStockDetail(symbol),
        api.getStockHistory(symbol, activeTab.toLowerCase()),
        api.getDashboard()
      ]);
      setStockDetail(detailRes);
      setCandles(Array.isArray(historyRes) ? historyRes : (historyRes.data || []));
      setCash(dashRes.portfolioSummary.virtualCash);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiInsight = async (action: 'BUY' | 'SELL' | 'VIEW' | 'REFRESH' = 'VIEW') => {
    setIsRefreshingAI(true);
    setAiError(null);
    try {
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      console.log('[StockDetail] mentor request', { symbol, tab: activeTab, action, requestId });
      const res = await api.getMentorInsight(action, symbol, activeTab.toLowerCase(), requestId);
      console.log('[StockDetail] mentor API response (full)', res);

      if (res?.error) {
        setAiInsight(null);
        setAiError(String(res.error));
        return;
      }
      const text = typeof res?.insight === 'string' ? res.insight : '';
      if (isMentorPlaceholderText(text)) {
        setAiInsight(null);
        setAiError('AI returned no usable insight. Check the server log or try again.');
        return;
      }
      setAiInsight(res);
    } catch (err) {
      console.error('[StockDetail] mentor request failed', err);
      setAiInsight(null);
      setAiError('Could not fetch AI insight right now.');
    } finally {
      setIsRefreshingAI(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [symbol, activeTab]);

  useEffect(() => {
    // Regenerate AI insight whenever chart timeframe changes.
    console.log('Fetching AI insight for tab:', activeTab);
    fetchAiInsight('VIEW');
  }, [symbol, activeTab]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || Object.keys(candles).length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const chartHeight = height - 40;
    const chartWidth = width - 60;

    ctx.fillStyle = '#0A0A0F';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1A1A26';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
       const y = (chartHeight / 4) * i;
       ctx.beginPath();
       ctx.moveTo(0, y);
       ctx.lineTo(chartWidth, y);
       ctx.stroke();
    }

    const allPrices = candles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...allPrices) * 0.995;
    const maxPrice = Math.max(...allPrices) * 1.005;
    const priceRange = maxPrice - minPrice;

    const getX = (index: number) => (index / (candles.length - 1)) * chartWidth;
    const getY = (price: number) => chartHeight - ((price - minPrice) / priceRange) * chartHeight;

    ctx.fillStyle = '#6B6B8A';
    ctx.font = '9px "IBM Plex Mono"';
    for (let i = 0; i < 5; i++) {
      const price = maxPrice - (priceRange / 4) * i;
      ctx.fillText(`₹${Math.round(price)}`, chartWidth + 5, (chartHeight / 4) * i + 3);
    }

    candles.forEach((candle, i) => {
      const x = getX(i);
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#00D4A1' : '#FF4757';
      const bodyColor = isGreen ? 'rgba(0, 212, 161, 0.2)' : 'rgba(255, 71, 87, 0.2)';

      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, getY(candle.high));
      ctx.lineTo(x, getY(candle.low));
      ctx.stroke();

      const bodyTop = getY(Math.max(candle.open, candle.close));
      const bodyBottom = getY(Math.min(candle.open, candle.close));
      const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
      const bodyWidth = (chartWidth / candles.length) * 0.6;

      ctx.fillStyle = bodyColor;
      ctx.fillRect(x - bodyWidth / 2, bodyTop, Math.max(bodyWidth, 1), bodyHeight);
    });

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
    if (!canvas || candles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    
    const chartWidth = rect.width - 60;
    const index = Math.round((x / chartWidth) * (candles.length - 1));
    
    if (index >= 0 && index < candles.length) {
      setTooltipData(candles[index]);
      setTooltipPos({ x, y: 50 });
    }
  };

  const executeOrder = async () => {
    try {
      if (buySell === 'BUY') {
        await api.buyTrade(symbol, quantity, orderType.toUpperCase());
      } else {
        await api.sellTrade(symbol, quantity);
      }
      setShowModal(true);
      setTimeout(async () => {
        const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        try {
          const res = await api.getMentorInsight(buySell, symbol, activeTab.toLowerCase(), requestId);
          console.log('[StockDetail] mentor API response after order (full)', res);
          if (res?.error) {
            setAiInsight(null);
            return;
          }
          const text = typeof res?.insight === 'string' ? res.insight : '';
          if (!isMentorPlaceholderText(text)) setAiInsight(res);
        } catch (e) {
          console.error('[StockDetail] mentor after order failed', e);
        }
      }, 500);
      loadData(); // refresh cash
    } catch (e: any) {
      alert(e.message || "Failed to execute order.");
    }
  };

  const handleRefreshAI = async () => {
    fetchAiInsight("REFRESH");
  };

  const aiInsightText = useMemo(() => {
    return typeof aiInsight === 'string' ? aiInsight : aiInsight?.insight || aiInsight?.message || '';
  }, [aiInsight]);

  const parsedInsight = useMemo(() => {
    const raw = String(aiInsightText || '').trim();
    if (!raw) return { conciseBullets: [] as string[], detailedText: '' };

    const detailedMatch = raw.match(/DETAILED:\s*([\s\S]*)$/i);
    const beforeDetailed = detailedMatch ? raw.slice(0, detailedMatch.index).trim() : raw;
    const detailedText = detailedMatch ? detailedMatch[1].trim() : '';

    const conciseSection = beforeDetailed.replace(/CONCISE BULLETS:\s*/i, '').trim();
    const lineToBullet = (line: string) =>
      line
        .replace(/^[-*•]\s+/, '')
        .replace(/^\d+[\).\s-]+/, '')
        .trim();

    let conciseBullets = conciseSection
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map(lineToBullet)
      .filter(Boolean);

    if (conciseBullets.length === 0 && conciseSection) {
      conciseBullets = conciseSection.split('. ').map((s) => lineToBullet(s)).filter(Boolean);
    }

    if (conciseBullets.length === 0) {
      const lines = beforeDetailed.split('\n').map((l) => l.trim()).filter(Boolean);
      const bulletLike = lines.filter(lineLooksLikeBullet);
      if (bulletLike.length > 0) {
        conciseBullets = bulletLike.map(lineToBullet).filter(Boolean);
      }
    }

    if (conciseBullets.length === 0 && !detailedText) {
      const body = conciseSection || beforeDetailed.replace(/CONCISE BULLETS:\s*/i, '').trim() || raw;
      const fromSentences = sentencesToBullets(body);
      if (fromSentences.length > 0) {
        conciseBullets = fromSentences;
      }
    }

    if (conciseBullets.length === 0 && !detailedText && raw) {
      conciseBullets = [raw];
    }

    return { conciseBullets, detailedText };
  }, [aiInsightText]);

  useEffect(() => {
    setShowDetailedInsight(false);
  }, [aiInsightText, symbol, activeTab]);

  if (loading || !stockDetail) {
    return <div className="min-h-screen bg-bg-primary flex justify-center items-center text-accent-gold"><RefreshCw className="animate-spin mr-2"/> Loading Stock...</div>;
  }

  const meta = stockDetail.meta || stockDetail;
  const currentPrice = Number(stockDetail.currentPrice || 0);
  const change = Number(stockDetail.change || 0);
  const changePercent = Number(stockDetail.changePercent ?? stockDetail.changePct ?? 0);
  const isPositive = change >= 0;

  return (
    <div className="relative min-h-screen w-full bg-bg-primary flex flex-col overflow-x-hidden">
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

      <main className="flex-1 pt-[70px] pb-[300px] px-4 overflow-y-auto no-scrollbar">
        <div className="mb-6">
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-heading font-bold text-text-primary">₹</span>
            <span className="text-[44px] font-heading font-bold text-text-primary leading-none tracking-tight">
              {currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`text-sm font-mono font-bold ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
              {isPositive ? '+' : ''}₹{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%) {isPositive ? '▲' : '▼'} Today
            </span>
          </div>
          <p className="text-[12px] text-text-muted mt-1">{meta.companyName}</p>
        </div>

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
                      <span className="text-text-muted">O: <span className="text-text-primary">₹{tooltipData.open?.toFixed(2)}</span></span>
                      <span className="text-text-muted">C: <span className="text-text-primary">₹{tooltipData.close?.toFixed(2)}</span></span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-bg-card border border-accent-gold/30 rounded-2xl p-4 mb-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🤖</span>
              <h3 className="text-sm font-heading font-bold text-text-primary">AI Insight</h3>
            </div>
            <span className="text-[10px] text-text-muted uppercase tracking-widest">Powered by Groq</span>
          </div>

          <div className="space-y-4 text-[13px] text-text-primary leading-relaxed">
            {isRefreshingAI ? (
              <p className="text-text-muted italic">Analyzing price data...</p>
            ) : aiInsightText ? (
              <div className="space-y-3">
                <ul className="list-disc pl-5 space-y-1">
                  {parsedInsight.conciseBullets.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
                {parsedInsight.detailedText && (
                  <>
                    <button
                      onClick={() => setShowDetailedInsight((prev) => !prev)}
                      className="text-[12px] font-bold text-accent-gold border border-border rounded-lg px-3 py-1"
                    >
                      {showDetailedInsight ? 'Hide detailed view' : 'Understand in depth'}
                    </button>
                    {showDetailedInsight && (
                      <p className="text-text-primary/90">{parsedInsight.detailedText}</p>
                    )}
                  </>
                )}
              </div>
            ) : aiError ? (
              <p className="text-accent-red">{aiError}</p>
            ) : (
              <p className="text-text-muted italic">Generating AI insight from {activeTab} price data...</p>
            )}
          </div>

          <button 
            onClick={handleRefreshAI}
            disabled={isRefreshingAI}
            className="w-full mt-4 py-2 border border-border rounded-xl text-[11px] font-bold text-text-muted flex items-center justify-center space-x-2"
          >
            <RefreshCw size={12} className={isRefreshingAI ? "animate-spin" : ""} />
            <span>{isRefreshingAI ? "Generating AI Insight..." : "Generate AI Insight ↻"}</span>
          </button>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-[390px] mx-auto bg-bg-secondary border-t border-border rounded-t-[24px] p-6 z-[60] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex bg-bg-primary p-1 rounded-xl mb-6">
          <button onClick={() => setBuySell('BUY')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${buySell === 'BUY' ? 'bg-accent-green text-bg-primary' : 'text-text-muted'}`}>BUY</button>
          <button onClick={() => setBuySell('SELL')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${buySell === 'SELL' ? 'bg-accent-red text-white' : 'text-text-muted'}`}>SELL</button>
        </div>

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
              ><Minus size={16} /></button>
              <span className="text-2xl font-mono font-bold text-text-primary">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full bg-bg-primary border border-border flex items-center justify-center text-text-primary"
              ><Plus size={16} /></button>
            </div>
          </div>
        </div>

        <div className="bg-bg-primary rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-text-muted">Market Price</span>
            <span className="text-text-primary font-mono">₹{currentPrice.toFixed(2)}</span>
          </div>
          <div className="h-[1px] bg-border my-2" />
          <div className="flex justify-between text-sm font-bold">
            <span className="text-text-primary">Total</span>
            <span className="text-text-primary font-mono">₹{(currentPrice * quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-[10px] pt-1">
            <span className="text-text-muted">Available Cash</span>
            <span className="text-text-primary">₹{cash.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button 
          onClick={executeOrder}
          className={`w-full py-4 rounded-2xl font-heading font-bold text-lg shadow-lg transition-transform active:scale-95 ${
            buySell === 'BUY' ? 'bg-accent-green text-bg-primary' : 'bg-accent-red text-white'
          }`}
        >
          {buySell} {symbol}
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-bg-primary/95 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-[320px] bg-bg-card border border-border rounded-[32px] p-8 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <motion.circle cx="50" cy="50" r="45" fill="none" stroke="#F0A500" strokeWidth="4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: "easeInOut" }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check size={48} className="text-accent-gold" />
                </div>
              </div>
              <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">Order Executed!</h2>
              <p className="text-sm text-text-primary mb-1">{buySell === 'BUY' ? 'Bought' : 'Sold'} {quantity} shares of {symbol}</p>
              
              {aiInsight && (
                <div className="bg-bg-secondary p-4 mt-6 text-left rounded-xl text-xs border border-accent-gold/20 leading-relaxed text-text-primary space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-lg shrink-0" aria-hidden="true">🤖</span>
                    <div className="min-w-0 flex-1 space-y-2">
                      {parsedInsight.conciseBullets.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1">
                          {parsedInsight.conciseBullets.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>{aiInsightText}</p>
                      )}
                      {parsedInsight.detailedText ? (
                        <p className="text-text-primary/90">{parsedInsight.detailedText}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 mt-8">
                <button onClick={() => navigate('/portfolio')} className="w-full py-3.5 bg-accent-gold text-bg-primary rounded-xl font-bold">View Portfolio</button>
                <button onClick={() => { setShowModal(false); setAiInsight(null); }} className="w-full py-3.5 border border-border text-text-primary rounded-xl font-bold">Trade More</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
