# Complete Finnhub API Data Specification for Frontend

## API Response Structure

Your n8n workflow provides a comprehensive stock research response with the following data structure:

```typescript
interface StockResearchResponse {
  success: boolean;
  data: {
    // Basic Company Information
    symbol: string;           // e.g., "MSFT"
    name: string;            // e.g., "Microsoft Corporation"
    
    // Real-time Price Data
    price: number;           // Current price: 420.50
    change: number;          // Price change: -2.31
    changePercent: number;   // Percentage change: -0.55
    dayHigh: number;         // Day's high: 425.10
    dayLow: number;          // Day's low: 418.25
    openPrice: number;       // Opening price: 422.77
    previousClose: number;   // Previous close: 422.81
    volume: number;          // Trading volume (may be 0 for basic plan)
    
    // Company Profile Data
    sector: string;          // e.g., "Technology"
    country: string;         // e.g., "US"
    exchange: string;        // e.g., "NASDAQ NMS - GLOBAL MARKET"
    marketCap: string;       // e.g., "$3100.0B" or "$2.1T"
    website: string;         // e.g., "https://www.microsoft.com/"
    logo: string;           // Company logo URL
    description: string;     // Rich company description
    
    // Financial Metrics
    peRatio: number | "N/A"; // Price-to-earnings ratio
    beta: number | "N/A";   // Market beta (volatility measure)
    
    // Technical Analysis
    technicals: {
      dayRange: string;        // e.g., "$418.25 - $425.10"
      openPrice: number;       // Same as openPrice above
      previousClose: number;   // Same as previousClose above
      week52High: number | "N/A"; // 52-week high price
      week52Low: number | "N/A";  // 52-week low price
      beta: number | "N/A";      // Duplicate of beta above
    };
    
    // Recent News
    news: Array<{
      title: string;          // News headline
      date: string;           // Date in YYYY-MM-DD format
      url: string;            // Full article URL
      summary: string;        // Article summary (150 chars + "...")
    }>;
    
    // Metadata
    lastUpdate: string;      // Date in YYYY-MM-DD format
    dataSource: string;      // "Finnhub"
    
    // Debug Information (for development)
    debug: {
      inputCount: number;
      quoteFields: string[];
      profileFields: string[];
      metricsFields: string[];
      newsCount: number;
      hasAllData: {
        quote: boolean;
        profile: boolean;
        metrics: boolean;
        news: boolean;
      };
    };
  };
}
```

## Available Data Categories

### 1. **Real-Time Market Data**
- Current stock price with live updates
- Price change (dollar amount and percentage)
- Daily trading range (high/low)
- Opening price and previous close
- Trading volume (when available)

### 2. **Company Information**
- Official company name
- Business sector/industry
- Country of incorporation
- Primary stock exchange
- Market capitalization
- Company website
- Official company logo
- Business description

### 3. **Financial Metrics**
- Price-to-earnings (P/E) ratio
- Beta coefficient (market volatility measure)
- 52-week high and low prices
- Market cap in human-readable format

### 4. **Recent News & Events**
- Up to 5 recent news articles
- Article headlines and summaries
- Publication dates
- Direct links to full articles

### 5. **Technical Analysis Data**
- Daily price range with formatted display
- Comparison points (open vs current, previous close)
- Long-term range indicators (52-week high/low)
- Volatility metrics (beta)

## Frontend Display Recommendations

### **Primary Header Section**
```javascript
// Company branding
data.logo          // Company logo image
data.name          // Full company name
data.symbol        // Stock ticker symbol
data.sector        // Industry sector badge
data.exchange      // Trading exchange info
```

### **Price Display Section**
```javascript
// Main price information
data.price         // Large, prominent current price
data.change        // Dollar change with +/- styling
data.changePercent // Percentage change with color coding
data.lastUpdate    // Timestamp for data freshness
```

### **Trading Data Section**
```javascript
// Daily trading metrics
data.dayHigh       // Day's highest price
data.dayLow        // Day's lowest price
data.openPrice     // Opening price
data.previousClose // Previous session close
data.technicals.dayRange // Formatted range string
```

### **Company Overview Section**
```javascript
// Business information
data.description   // Company business description
data.website       // Clickable company website link
data.country       // Company headquarters country
data.marketCap     // Formatted market capitalization
```

### **Financial Metrics Section**
```javascript
// Investment metrics
data.peRatio             // Price-to-earnings ratio
data.beta                // Market beta coefficient
data.technicals.week52High // 52-week high price
data.technicals.week52Low  // 52-week low price
```

### **News Section**
```javascript
// Recent news articles
data.news.forEach(article => {
  article.title    // Article headline
  article.date     // Publication date
  article.summary  // Article summary
  article.url      // Link to full article
});
```

## Color Coding Suggestions

### **Price Movement Colors**
- Green (#10B981): Positive change (change > 0)
- Red (#EF4444): Negative change (change < 0)
- Gray (#6B7280): No change (change === 0)

### **Data Availability Indicators**
- Available data: Normal text color
- Missing data ("N/A"): Muted/gray color
- Loading state: Skeleton/shimmer effect

## Error Handling

The API response includes debug information to help handle missing data:

```javascript
// Check data availability
if (data.debug.hasAllData.quote) {
  // Display full price information
} else {
  // Show limited data or error state
}

if (data.debug.hasAllData.profile) {
  // Display company information
} else {
  // Hide company details or show placeholder
}
```

## Sample Implementation Notes

### **Responsive Design**
- Mobile: Stack price and company info vertically
- Desktop: Side-by-side layout with detailed metrics
- All screen sizes: Ensure logo and key metrics are prominent

### **Data Refresh**
- Real-time data updates every 15-60 seconds
- Visual indicators for data freshness
- Handle loading states gracefully

### **User Experience**
- Make company website clickable
- News articles open in new tabs
- Smooth transitions for data updates
- Clear visual hierarchy for different data types

This specification covers all available data points from the Finnhub API integration, providing a comprehensive foundation for building a rich stock research interface.