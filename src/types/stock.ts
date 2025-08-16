export interface StockData {
  // Basic Company Information
  symbol: string;
  name: string;
  
  // Real-time Price Data
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  openPrice: number;
  previousClose: number;
  volume: number;
  
  // Company Profile Data
  sector: string;
  country: string;
  exchange: string;
  marketCap: string;
  website: string;
  logo: string;
  description: string;
  
  // Financial Metrics
  peRatio: number | "N/A";
  beta: number | "N/A";
  
  // Technical Analysis
  technicals: {
    dayRange: string;
    openPrice: number;
    previousClose: number;
    week52High: number | "N/A";
    week52Low: number | "N/A";
    beta: number | "N/A";
  };
  
  // Recent News
  news: NewsItem[];
  
  // Metadata
  lastUpdate: string;
  dataSource: string;
  
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
}

export interface NewsItem {
  title: string;
  date: string;
  url: string;
  summary: string;
}

export interface StockResponse {
  success: boolean;
  data?: StockData;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface StockFormData {
  symbol: string;
}

// New types for stock screening
export interface ScreeningResult {
  symbol: string;
  name: string;
  sector: string;
  score: number;
  rating: 'STRONG BUY' | 'BUY' | 'WEAK BUY' | 'HOLD' | 'AVOID';
  price: number;
  changePercent: number;
  marketCap: number;
  peRatio: number | null;
  week52High: number | null;
  distanceFrom52High: string | null;
  scoreBreakdown: {
    momentum: number;
    quality: number;
    technical: number;
  };
  rank?: number;
}

export interface ScreeningSummary {
  totalScreened: number;
  averageScore: number;
  strongBuys: number;
  buys: number;
  topSector: string;
}

export interface ScreeningResponse {
  success: boolean;
  timestamp: string;
  summary: ScreeningSummary;
  results: ScreeningResult[];
  error?: string;
}

export interface ScreeningFormData {
  batchSize?: number;
  startIndex?: number;
  type?: 'momentum' | 'conservative' | 'aggressive';
  sector?: string;
  marketCap?: 'Large' | 'Mid' | 'Small' | 'All';
}
