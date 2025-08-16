# Stock Research App

A comprehensive stock research tool that connects a Next.js frontend to n8n workflows for automated data processing using Finnhub API.

## Features

- **Real-time Stock Quotes**: Current price, change, and daily trading range
- **Company Profiles**: Name, sector, market cap, exchange, and country
- **Trading Data**: Day high/low, open price, previous close, and price comparisons
- **Company Logos**: Visual company branding with fallback handling
- **Recent News**: Latest headlines with summaries and direct links
- **Rich Company Info**: Website links, exchange details, and comprehensive descriptions
- **Stock Screener**: Intelligent screening of 500+ stocks for momentum opportunities
- **Dark Theme UI**: Clean, modern interface with purple accents
- **Mobile Responsive**: Works seamlessly on all devices

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with dark theme
- **Backend**: n8n workflows with Finnhub API integration
- **Data Source**: Finnhub API (real-time quotes, company profiles, news)
- **State Management**: React hooks (no external state)

## Getting Started

### Prerequisites

1. **Node.js** 18+ installed
2. **n8n Instance** with Finnhub API integration

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stock-research-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_N8N_WEBHOOK_URL_RESEARCHER=https://your-n8n-instance.com/webhook/stock-research
NEXT_PUBLIC_N8N_WEBHOOK_URL_SCREENER=https://your-n8n-instance.com/webhook/screen-stocks
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Phases

### Phase 1: Individual Stock Research ✅
- [x] Initialize Next.js project with TypeScript
- [x] Setup Tailwind with dark theme + purple colors
- [x] Create basic form component
- [x] Add loading and error states
- [x] Create n8n workflow for individual stock research
- [x] Connect frontend to n8n webhook
- [x] Style results display with rich data
- [x] Add error handling and CORS support
- [x] Improve UI/UX with company logos
- [x] Add input validation and responsive design
- [x] Enhanced data visualization
- [x] Comprehensive documentation

### Phase 2: Stock Screening ✅
- [x] Create stock screening n8n workflow
- [x] Build screening form with filters and options
- [x] Implement screening results display
- [x] Add navigation between research and screening
- [x] Create screening API route
- [x] Add comprehensive scoring algorithm
- [x] Display score breakdowns and rankings

## Project Structure

```
stock-research-app/
├── src/
│   ├── app/
│   │   ├── globals.css          # Dark theme styles
│   │   ├── layout.tsx           # Root layout with navigation
│   │   ├── page.tsx             # Main research page
│   │   ├── screening/
│   │   │   └── page.tsx         # Stock screening page
│   │   └── api/
│   │       ├── stock-research/
│   │       │   └── route.ts     # Research API proxy route
│   │       └── stock-screening/
│   │           └── route.ts     # Screening API proxy route
│   ├── components/
│   │   ├── Navigation.tsx       # App navigation component
│   │   ├── StockForm.tsx        # Research input form
│   │   ├── StockReport.tsx      # Research results display
│   │   ├── ScreeningForm.tsx    # Screening form component
│   │   ├── ScreeningResults.tsx # Screening results display
│   │   └── LoadingSpinner.tsx   # Loading state component
│   ├── types/
│   │   └── stock.ts             # TypeScript interfaces
│   └── utils/
│       └── api.ts               # API utility functions
├── public/                      # Static assets
└── README.md                    # This file
```

## Features Overview

### Individual Stock Research
- Enter any stock symbol for comprehensive analysis
- Real-time quotes, company profiles, and news
- Technical indicators and financial metrics
- Mobile-responsive design

### Stock Screener
- Screen 500+ high-quality stocks automatically
- Intelligent scoring algorithm (0-100 points)
- Score breakdown: Momentum (40%), Quality (30%), Technical (30%)
- Filter by sector, market cap, and screening strategy
- Ranked results with actionable insights
- Results typically available in 30 seconds

## API Integration

The app connects to two n8n workflows:

### Research Workflow
- **Endpoint**: `/api/stock-research`
- **Method**: POST
- **Request**: `{ "symbol": "AAPL" }`
- **Response**: Comprehensive stock data with company info, trading data, and news

### Screening Workflow
- **Endpoint**: `/api/stock-screening`
- **Method**: POST
- **Request**: `{ "batchSize": 20, "type": "momentum", "sector": "Technology" }`
- **Response**: Ranked list of screened stocks with scores and breakdowns

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_N8N_WEBHOOK_URL_RESEARCHER` | URL of your n8n webhook endpoint for individual stock research | Yes |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL_SCREENER` | URL of your n8n webhook endpoint for stock screening | Yes |

## Usage

### Individual Stock Research
1. Navigate to the Research page
2. Enter a stock symbol (e.g., AAPL, MSFT, GOOGL, TSLA)
3. Click "Research Stock"
4. View comprehensive data including company info, price data, and news

### Stock Screening
1. Navigate to the Screener page
2. Choose screening parameters:
   - **Strategy**: Momentum (balanced), Conservative, or Aggressive
   - **Batch Size**: 10-100 stocks per screening
   - **Sector**: Focus on specific sectors or screen all
   - **Market Cap**: Large, Mid, Small, or All caps
3. Click "Start Screening"
4. View ranked results with score breakdowns and actionable insights

## Contributing

1. Follow the PRD (Product Requirements Document) for feature development
2. Keep the architecture simple and maintainable
3. Test thoroughly before submitting changes
4. Follow TypeScript best practices

## License

This project is for educational purposes only. Stock data should not be used for actual trading decisions without proper verification.

## Next Steps

- [ ] Add data persistence for research history
- [ ] Implement watchlists and alerts
- [ ] Add portfolio tracking capabilities
- [ ] Expand technical indicators (RSI, SMA, MACD)
- [ ] Add price charts and historical data
- [ ] Implement Supabase integration for data storage
