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
