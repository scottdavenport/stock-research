# Simple Stock Research App - Product Requirements Document

**Version**: 1.0  
**Date**: August 15, 2025  
**Scope**: MVP Phase 1 - Basic Stock Symbol Research  
**Timeline**: 1-2 days to working prototype

---

## 1. Problem & Goal

**Problem**: Need a simple way to research individual stocks with consistent, automated data gathering.

**Goal**: Build a minimal viable stock research tool that connects a web frontend to n8n workflows for data processing.

**Success Criteria**: Enter any stock symbol → get formatted research report in under 10 seconds.

---

## 2. User Story

**As a** beginner investor  
**I want to** enter a stock symbol and get key research data  
**So that** I can make informed decisions without manually gathering data from multiple sources

**Core Flow**:
1. User opens web app
2. Enters stock symbol (e.g., "AAPL")
3. Clicks "Research"
4. Gets formatted report with key metrics
5. Can research another symbol

---

## 3. Scope & Non-Goals

### In Scope (Phase 1)
- Single stock symbol research
- Basic company information
- Current price and daily change
- Simple technical indicators (RSI, SMA20/50)
- Recent news headlines (3-5 items)
- Clean, dark-themed UI with purple accents

### Explicitly Out of Scope
- Trading functionality
- Portfolio tracking
- Stock screening/discovery
- User accounts/authentication
- Data persistence (no database yet)
- Complex analysis or scoring
- Real-time data updates

---

## 4. Technical Architecture

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS (dark theme + purple accents)
- **Components**: Single page with form and results display
- **State**: Simple React state (no external state management)

### Backend/Integration
- **API Layer**: n8n workflow exposed as webhook
- **Data Sources**: Alpha Vantage API (free tier)
- **Flow**: Frontend → n8n webhook → Alpha Vantage → formatted response

### Data Flow
```
User Input (Symbol) 
  ↓
Next.js Frontend
  ↓ 
HTTP POST to n8n webhook
  ↓
n8n Workflow:
  1. Validate symbol
  2. Fetch from Alpha Vantage API
  3. Calculate basic indicators
  4. Format response
  ↓
JSON Response back to Frontend
  ↓
Display formatted results
```

---

## 5. Features & Requirements

### 5.1 Frontend Features
- **Input Form**
  - Stock symbol input field (auto-uppercase)
  - Submit button
  - Loading state during API call
  - Error handling for invalid symbols

- **Results Display**
  - Company name and symbol
  - Current price and daily change (% and $)
  - Key metrics in clean cards/sections
  - News headlines with dates
  - Technical indicators with simple explanations

- **UI/UX**
  - Dark theme as default
  - Purple accent colors (#8B5CF6, #A855F7)
  - Responsive design (mobile-friendly)
  - Fast loading and smooth interactions

### 5.2 n8n Workflow Requirements
- **Webhook Trigger**: Accept POST with `{ symbol: string }`
- **Data Fetching**: Alpha Vantage API integration
- **Data Processing**: Calculate RSI, moving averages
- **Response Format**: Consistent JSON structure
- **Error Handling**: Invalid symbols, API failures

### 5.3 Data Requirements
From Alpha Vantage API:
- **Quote Data**: Current price, change, volume
- **Company Overview**: Name, sector, description
- **Technical Indicators**: RSI(14), SMA(20), SMA(50)
- **News**: Recent headlines (if available)

---

## 6. API Specifications

### n8n Webhook Endpoint
```
POST /webhook/stock-research
Content-Type: application/json

Request:
{
  "symbol": "AAPL"
}

Response:
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "name": "Apple Inc",
    "price": 175.25,
    "change": 2.15,
    "changePercent": 1.24,
    "volume": 45123456,
    "sector": "Technology",
    "description": "Apple Inc. designs, manufactures...",
    "technicals": {
      "rsi": 62.5,
      "sma20": 172.30,
      "sma50": 168.90
    },
    "news": [
      {
        "title": "Apple Announces New...",
        "date": "2025-08-15",
        "url": "https://..."
      }
    ]
  }
}

Error Response:
{
  "success": false,
  "error": "Symbol not found"
}
```

---

## 7. File Structure

```
stock-research-app/
├── src/
│   ├── components/
│   │   ├── StockForm.tsx
│   │   ├── StockReport.tsx
│   │   └── LoadingSpinner.tsx
│   ├── pages/
│   │   └── index.tsx
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       └── stock.ts
├── public/
├── package.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

---

## 8. Setup Requirements

### Prerequisites
1. **Alpha Vantage API Key** (free at alphavantage.co)
2. **n8n Instance** (existing account)
3. **Node.js** 18+ for Next.js development

### Environment Variables
```env
# For n8n workflow
ALPHA_VANTAGE_API_KEY=your_api_key_here

# For frontend
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/stock-research
```

---

## 9. Development Phases

### Phase 1a: Frontend Setup (Day 1)
- [ ] Initialize Next.js project with TypeScript
- [ ] Setup Tailwind with dark theme + purple colors
- [ ] Create basic form component
- [ ] Add loading and error states

### Phase 1b: n8n Workflow (Day 1)
- [ ] Create webhook trigger in n8n
- [ ] Setup Alpha Vantage API calls
- [ ] Add basic data processing
- [ ] Test with sample symbols

### Phase 1c: Integration (Day 2)
- [ ] Connect frontend to n8n webhook
- [ ] Style results display
- [ ] Add error handling
- [ ] Test full flow

### Phase 1d: Polish (Day 2)
- [ ] Improve UI/UX
- [ ] Add input validation
- [ ] Responsive design
- [ ] Basic documentation

---

## 10. Success Metrics

### Functional
- [ ] Can research any valid stock symbol
- [ ] Results display in under 10 seconds
- [ ] Handles invalid symbols gracefully
- [ ] Mobile-responsive design

### Technical
- [ ] n8n workflow runs reliably
- [ ] Frontend handles API failures
- [ ] Clean, maintainable code structure
- [ ] Ready for Phase 2 features

---

## 11. Future Phases (Not in MVP)

**Phase 2**: Add data persistence and research history  
**Phase 3**: Stock discovery/screening features  
**Phase 4**: Basic portfolio tracking  
**Phase 5**: Trading integration

---

## 12. Risk Mitigation

- **API Rate Limits**: Alpha Vantage free tier (25/day) - upgrade if needed
- **n8n Reliability**: Keep workflows simple, add error handling
- **Data Quality**: Validate all API responses before display
- **User Experience**: Clear loading states and error messages

---

## Notes for Development

This PRD is intentionally minimal to get a working prototype quickly. The architecture is designed to easily add features in future phases without major refactoring.

Focus on getting the core flow working first, then iterate on UI/UX and additional features.