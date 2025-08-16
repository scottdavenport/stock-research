# Stock Research & Screening App - Updated PRD

**Version**: 2.0  
**Date**: August 16, 2025  
**Goal**: Build intelligent stock screening to identify high-momentum opportunities  
**Target**: Find stocks with potential for significant returns in 30-60 days

---

## Phase 1 Status: ✅ COMPLETE
- Individual stock research with Finnhub API ✅
- Real-time price, company profile, technicals ✅
- News integration ✅
- Dark theme UI with purple accents ✅

---

## Phase 2: Intelligent Stock Screening Agent

### Problem Statement
Manual stock research is time-consuming and requires checking hundreds of stocks. We need an automated screening system that identifies high-momentum stocks with strong fundamental backing that have potential for significant returns.

### Success Criteria
- Screen 500+ stocks in under 30 seconds
- Identify 10-20 high-potential candidates daily
- Score stocks based on momentum + fundamental criteria
- Provide actionable insights for each candidate

---

## Core Screening Criteria (Research-Backed)

### **Momentum Indicators** (60% weight)
1. **Price vs Moving Averages**
   - Price > SMA20 > SMA50 > SMA200 (aligned uptrend)
   - Recent breakout above 20-day high
   - Distance from 52-week high < 25%

2. **Volume Confirmation**
   - Relative volume > 150% (unusual activity)
   - Volume surge in last 5 days
   - Price + volume confirmation (not volume divergence)

3. **Technical Momentum**
   - RSI(14) between 45-75 (strong but not overbought)
   - MACD positive and rising
   - Recent gap up or breakout pattern

### **Fundamental Quality** (25% weight)
1. **Growth Metrics**
   - Revenue growth > 15% YoY
   - EPS growth positive
   - Recent earnings beat (if available)

2. **Financial Health**
   - Market cap > $100M (avoid penny stocks)
   - Debt/Equity < 2.0
   - Positive cash flow

### **Catalyst Factors** (15% weight)
1. **News & Events**
   - Recent positive news (earnings, partnerships, upgrades)
   - Analyst upgrades or target increases
   - Industry momentum

2. **Market Position**
   - Sector strength
   - Relative strength vs SPY
   - Institutional interest

---

## Technical Implementation

### **Architecture**
```
User Input (Screening Criteria)
  ↓
Frontend Screening Interface  
  ↓
n8n Batch Processing Workflow
  ↓
Parallel API Calls (50-100 stocks/batch)
  ↓ 
Scoring Algorithm
  ↓
Ranked Results with Actionable Insights
```

### **Data Sources**
- **Finnhub**: Quote data, technicals, news
- **Stock Universe**: S&P 500 + Russell 2000 (expandable)
- **Screening Lists**: Predefined momentum/growth stocks

### **Scoring Algorithm**
```javascript
Score = (
  0.60 * MomentumScore +    // Technical indicators
  0.25 * FundamentalScore + // Growth & quality
  0.15 * CatalystScore      // News & events
) * 100

Where each component ranges 0-1
```

---

## User Interface Design

### **Screening Dashboard**
1. **Quick Filters**
   - Momentum Level: Conservative | Moderate | Aggressive
   - Market Cap: Small | Mid | Large | All
   - Sector Focus: Technology | Healthcare | All

2. **Results Display**
   - Top 20 ranked opportunities
   - Score breakdown (visual bars)
   - Key metrics: Price change, volume, catalyst
   - One-click research (link to existing research page)

3. **Watchlist Integration**
   - Save promising candidates
   - Track performance over time
   - Set alerts for entry/exit points

### **Individual Stock Cards**
```
[Company Logo] AAPL - Apple Inc                    Score: 87/100
$175.25 (+2.3%) | Volume: 2.1x avg | Near 52W High: 15%

Momentum: ████████░░ 80%    Breakout above $170 resistance
Quality:  ██████░░░░ 60%    Strong EPS growth, low debt  
Catalyst: ████████░░ 80%    iPhone 15 launch momentum

[Research Details] [Add to Watchlist] [Set Alert]
```

---

## Development Phases

### **Phase 2a: Basic Screener (Week 1)**
- [ ] Build stock universe management (S&P 500)
- [ ] Create batch API processing in n8n
- [ ] Implement basic momentum scoring
- [ ] Simple results display

### **Phase 2b: Advanced Scoring (Week 2)**  
- [ ] Add fundamental analysis scoring
- [ ] Integrate news sentiment analysis
- [ ] Build comprehensive scoring algorithm
- [ ] Add filtering and sorting options

### **Phase 2c: UI Enhancement (Week 3)**
- [ ] Professional screener interface
- [ ] Watchlist functionality
- [ ] Performance tracking
- [ ] Mobile optimization

### **Phase 2d: Intelligence Features (Week 4)**
- [ ] Daily automated scans
- [ ] Alert system (email/push notifications)
- [ ] Historical performance tracking
- [ ] Strategy backtesting

---

## Success Metrics

### **Technical Performance**
- Screen 500+ stocks in < 30 seconds
- 99% API reliability
- Real-time data updates
- Mobile-responsive design

### **Trading Performance**
- Identify 10-20 candidates daily
- Track hit rate of recommendations
- Monitor average return of top-scored stocks
- User engagement with recommendations

---

## Risk Management Features

### **Built-in Safeguards**
1. **Diversification Enforcement**
   - Max 3 stocks per sector
   - Position sizing recommendations
   - Risk/reward ratios

2. **Quality Filters**
   - Exclude penny stocks (< $5)
   - Minimum volume requirements
   - Financial health checks

3. **Market Condition Awareness**
   - Bull/bear market adjustments
   - VIX-based risk scaling
   - Sector rotation detection

---

## Phase 3 Preview: Advanced Features

- **AI-Powered Predictions**: Machine learning models for price targets
- **Social Sentiment**: Reddit/Twitter sentiment analysis  
- **Options Flow**: Unusual options activity integration
- **Earnings Calendar**: Pre/post earnings momentum plays
- **Sector Rotation**: Identify shifting market trends

---

## Immediate Next Steps

1. **Research Additional APIs**: Investigate free/low-cost screening APIs
2. **Build Stock Universe**: Create database of 500+ liquid stocks
3. **Prototype Screener**: Simple n8n workflow to score 50 stocks
4. **Test Scoring Logic**: Validate momentum scoring with known performers

The goal is to transform from "research any stock" to "find the best stocks automatically" - making the hunt for high-momentum opportunities systematic rather than random.