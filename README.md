# Stock Research App

A comprehensive stock research tool that connects a Next.js frontend to n8n workflows for automated data processing using Finnhub API.

## Features

- **Real-time Stock Quotes**: Current price, change, and daily trading range
- **Company Profiles**: Name, sector, market cap, exchange, and country
- **Trading Data**: Day high/low, open price, previous close, and price comparisons
- **Company Logos**: Visual company branding with fallback handling
- **Recent News**: Latest headlines with summaries and direct links
- **Rich Company Info**: Website links, exchange details, and comprehensive descriptions
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
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/stock-research
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Phases

### Phase 1a: Frontend Setup ✅
- [x] Initialize Next.js project with TypeScript
- [x] Setup Tailwind with dark theme + purple colors
- [x] Create basic form component
- [x] Add loading and error states

### Phase 1b: n8n Workflow ✅
- [x] Create webhook trigger in n8n
- [x] Setup Finnhub API calls (quote, profile, news)
- [x] Add comprehensive data processing
- [x] Test with sample symbols

### Phase 1c: Integration ✅
- [x] Connect frontend to n8n webhook
- [x] Style results display with rich data
- [x] Add error handling and CORS support
- [x] Test full flow

### Phase 1d: Polish ✅
- [x] Improve UI/UX with company logos
- [x] Add input validation and responsive design
- [x] Enhanced data visualization
- [x] Comprehensive documentation

## Project Structure

```
stock-research-app/
├── src/
│   ├── app/
│   │   ├── globals.css          # Dark theme styles
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Main app page
│   │   └── api/
│   │       └── stock-research/
│   │           └── route.ts     # API proxy route
│   ├── components/
│   │   ├── StockForm.tsx        # Input form component
│   │   ├── StockReport.tsx      # Enhanced results display
│   │   └── LoadingSpinner.tsx   # Loading state component
│   ├── types/
│   │   └── stock.ts             # TypeScript interfaces
│   └── utils/
│       └── api.ts               # API utility functions
├── public/                      # Static assets
└── README.md                    # This file
```

## API Integration

The app is connected to an n8n workflow that processes stock data from Finnhub API:

- **Endpoint**: Configured via environment variable
- **Method**: POST
- **Request**: `{ "symbol": "AAPL" }`
- **Response**: Comprehensive stock data with company info, trading data, and news

## API Response Format

The n8n webhook returns rich data in this format:

```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "name": "Apple Inc",
    "price": 231.59,
    "change": -1.19,
    "changePercent": -0.51,
    "dayHigh": 234.28,
    "dayLow": 229.34,
    "openPrice": 234.00,
    "previousClose": 232.78,
    "volume": 0,
    "marketCap": "$3458.4B",
    "sector": "Technology",
    "country": "US",
    "exchange": "NASDAQ NMS - GLOBAL MARKET",
    "website": "https://www.apple.com/",
    "logo": "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/AAPL.png",
    "description": "Apple Inc operates in the Technology sector...",
    "technicals": {
      "dayRange": "$229.34 - $234.28",
      "openPrice": 234.00,
      "previousClose": 232.78
    },
    "news": [
      {
        "title": "Apple Announces New...",
        "date": "2025-08-15",
        "url": "https://...",
        "summary": "Summary of the news article..."
      }
    ],
    "lastUpdate": "2025-08-15",
    "dataSource": "Finnhub"
  }
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | URL of your n8n webhook endpoint | Yes |

## Usage

1. Enter a stock symbol (e.g., AAPL, MSFT, GOOGL, TSLA)
2. Click "Research Stock"
3. View comprehensive data including:
   - **Company Info**: Logo, name, sector, exchange, country
   - **Price Data**: Current price, change, day range, open/close
   - **Trading Data**: High/low, open price, previous close comparisons
   - **Company Details**: Market cap, website, comprehensive description
   - **Recent News**: Headlines with summaries and direct links
   - **Data Source**: Finnhub API with timestamp

## Contributing

1. Follow the PRD (Product Requirements Document) for feature development
2. Keep the architecture simple and maintainable
3. Test thoroughly before submitting changes
4. Follow TypeScript best practices

## License

This project is for educational purposes only. Stock data should not be used for actual trading decisions without proper verification.

## Next Steps

- [ ] Add data persistence for research history
- [ ] Implement stock screening features
- [ ] Add portfolio tracking capabilities
- [ ] Expand technical indicators (RSI, SMA, MACD)
- [ ] Add price charts and historical data
- [ ] Implement watchlists and alerts
