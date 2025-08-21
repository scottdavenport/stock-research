-- Stock Universe Management Tables with Simple Security

-- Main stock universe table
CREATE TABLE stock_universe (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sector TEXT,
  market_cap_tier TEXT CHECK (market_cap_tier IN ('Large', 'Mid', 'Small')),
  exchange TEXT,
  country TEXT DEFAULT 'US',
  is_active BOOLEAN DEFAULT TRUE,
  added_date TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) DEFAULT NULL -- For future user tracking
);

-- Stock screening results history
CREATE TABLE screening_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL REFERENCES stock_universe(symbol),
  screening_date DATE NOT NULL DEFAULT CURRENT_DATE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  rating TEXT CHECK (rating IN ('STRONG BUY', 'BUY', 'WEAK BUY', 'HOLD', 'AVOID')),
  price DECIMAL(10,2),
  change_amount DECIMAL(10,2),
  change_percent DECIMAL(5,2),
  market_cap DECIMAL(15,2),
  score_breakdown JSONB, -- {momentum: 32, quality: 28, liquidity: 15, technical: 12}
  technicals JSONB,     -- {peRatio: 28.5, beta: 1.2, week52High: 180.50, etc}
  signals JSONB,        -- {nearHigh: true, strongDay: false, largeCap: true}
  rank_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) DEFAULT NULL -- For future user tracking
);

-- Universe lists (different screening groups)
CREATE TABLE universe_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE, -- Public lists vs user-specific lists
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) DEFAULT NULL -- For future user tracking
);

-- Junction table for stocks in different lists
CREATE TABLE universe_list_stocks (
  list_id UUID REFERENCES universe_lists(id) ON DELETE CASCADE,
  symbol TEXT REFERENCES stock_universe(symbol) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id) DEFAULT NULL, -- For future user tracking
  PRIMARY KEY (list_id, symbol)
);

-- Stock performance tracking (for historical analysis)
CREATE TABLE stock_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL REFERENCES stock_universe(symbol),
  date DATE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  volume BIGINT,
  high DECIMAL(10,2),
  low DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, date)
);

-- User watchlists (for future use)
CREATE TABLE user_watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist stocks
CREATE TABLE user_watchlist_stocks (
  watchlist_id UUID REFERENCES user_watchlists(id) ON DELETE CASCADE,
  symbol TEXT REFERENCES stock_universe(symbol) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  PRIMARY KEY (watchlist_id, symbol)
);

-- User screening sessions table (for async screening workflow)
CREATE TABLE user_screening_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  total_stocks_screened INTEGER DEFAULT 0,
  total_buy_rated INTEGER DEFAULT 0,
  buy_percentage NUMERIC(5,2) DEFAULT 0,
  average_score NUMERIC(5,2) DEFAULT 0,
  processing_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  screening_filters JSONB -- Store the original screening parameters
);

-- Update screening_results table to work with sessions
ALTER TABLE screening_results ADD COLUMN session_id UUID REFERENCES user_screening_sessions(id) ON DELETE CASCADE;
ALTER TABLE screening_results ADD COLUMN rank_position INTEGER;

-- Indexes for better performance
CREATE INDEX idx_stock_universe_symbol ON stock_universe(symbol);
CREATE INDEX idx_stock_universe_active ON stock_universe(is_active);
CREATE INDEX idx_stock_universe_sector ON stock_universe(sector);
CREATE INDEX idx_screening_results_date ON screening_results(screening_date DESC);
CREATE INDEX idx_screening_results_score ON screening_results(score DESC);
CREATE INDEX idx_screening_results_symbol_date ON screening_results(symbol, screening_date DESC);
CREATE INDEX idx_screening_results_rating ON screening_results(rating);
CREATE INDEX idx_stock_performance_symbol_date ON stock_performance(symbol, date DESC);
CREATE INDEX idx_universe_lists_public ON universe_lists(is_public);

-- Indexes for session-based screening
CREATE INDEX idx_user_screening_sessions_user_email ON user_screening_sessions(user_email);
CREATE INDEX idx_user_screening_sessions_status ON user_screening_sessions(status);
CREATE INDEX idx_user_screening_sessions_created_at ON user_screening_sessions(created_at DESC);
CREATE INDEX idx_screening_results_session_id ON screening_results(session_id);
CREATE INDEX idx_screening_results_rank_position ON screening_results(rank_position);

-- Insert default data
INSERT INTO universe_lists (name, description, is_default, is_public) VALUES 
('Default Momentum Universe', 'High-quality stocks suitable for momentum trading', TRUE, TRUE),
('S&P 500 Large Caps', 'S&P 500 constituents for stable momentum plays', FALSE, TRUE),
('Tech Growth Stocks', 'Technology sector growth opportunities', FALSE, TRUE),
('Healthcare Innovation', 'Healthcare and biotech momentum candidates', FALSE, TRUE);

-- Insert starter stock universe
INSERT INTO stock_universe (symbol, name, sector, market_cap_tier, exchange) VALUES 
('AAPL', 'Apple Inc', 'Technology', 'Large', 'NASDAQ'),
('MSFT', 'Microsoft Corporation', 'Technology', 'Large', 'NASDAQ'),
('GOOGL', 'Alphabet Inc', 'Technology', 'Large', 'NASDAQ'),
('AMZN', 'Amazon.com Inc', 'Consumer Discretionary', 'Large', 'NASDAQ'),
('TSLA', 'Tesla Inc', 'Consumer Discretionary', 'Large', 'NASDAQ'),
('META', 'Meta Platforms Inc', 'Technology', 'Large', 'NASDAQ'),
('NVDA', 'NVIDIA Corporation', 'Technology', 'Large', 'NASDAQ'),
('NFLX', 'Netflix Inc', 'Communication Services', 'Large', 'NASDAQ'),
('CRM', 'Salesforce Inc', 'Technology', 'Large', 'NYSE'),
('ADBE', 'Adobe Inc', 'Technology', 'Large', 'NASDAQ'),
('PYPL', 'PayPal Holdings Inc', 'Financial Services', 'Large', 'NASDAQ'),
('INTC', 'Intel Corporation', 'Technology', 'Large', 'NASDAQ'),
('AMD', 'Advanced Micro Devices', 'Technology', 'Large', 'NASDAQ'),
('QCOM', 'QUALCOMM Incorporated', 'Technology', 'Large', 'NASDAQ'),
('AVGO', 'Broadcom Inc', 'Technology', 'Large', 'NASDAQ'),
('TXN', 'Texas Instruments', 'Technology', 'Large', 'NASDAQ'),
('ORCL', 'Oracle Corporation', 'Technology', 'Large', 'NYSE'),
('IBM', 'International Business Machines', 'Technology', 'Large', 'NYSE'),
('CSCO', 'Cisco Systems Inc', 'Technology', 'Large', 'NASDAQ'),
('SNOW', 'Snowflake Inc', 'Technology', 'Large', 'NYSE'),
('JPM', 'JPMorgan Chase & Co', 'Financial Services', 'Large', 'NYSE'),
('BAC', 'Bank of America Corp', 'Financial Services', 'Large', 'NYSE'),
('WFC', 'Wells Fargo & Company', 'Financial Services', 'Large', 'NYSE'),
('GS', 'Goldman Sachs Group Inc', 'Financial Services', 'Large', 'NYSE'),
('MS', 'Morgan Stanley', 'Financial Services', 'Large', 'NYSE'),
('V', 'Visa Inc', 'Financial Services', 'Large', 'NYSE'),
('MA', 'Mastercard Incorporated', 'Financial Services', 'Large', 'NYSE'),
('JNJ', 'Johnson & Johnson', 'Healthcare', 'Large', 'NYSE'),
('PFE', 'Pfizer Inc', 'Healthcare', 'Large', 'NYSE'),
('UNH', 'UnitedHealth Group Inc', 'Healthcare', 'Large', 'NYSE'),
('ABBV', 'AbbVie Inc', 'Healthcare', 'Large', 'NYSE'),
('TMO', 'Thermo Fisher Scientific', 'Healthcare', 'Large', 'NYSE'),
('ABT', 'Abbott Laboratories', 'Healthcare', 'Large', 'NYSE'),
('MRNA', 'Moderna Inc', 'Healthcare', 'Mid', 'NASDAQ'),
('GILD', 'Gilead Sciences Inc', 'Healthcare', 'Large', 'NASDAQ'),
('KO', 'Coca-Cola Company', 'Consumer Staples', 'Large', 'NYSE'),
('PEP', 'PepsiCo Inc', 'Consumer Staples', 'Large', 'NASDAQ'),
('WMT', 'Walmart Inc', 'Consumer Staples', 'Large', 'NYSE'),
('COST', 'Costco Wholesale Corp', 'Consumer Staples', 'Large', 'NASDAQ'),
('TGT', 'Target Corporation', 'Consumer Discretionary', 'Large', 'NYSE'),
('HD', 'Home Depot Inc', 'Consumer Discretionary', 'Large', 'NYSE'),
('LOW', 'Lowe''s Companies Inc', 'Consumer Discretionary', 'Large', 'NYSE'),
('MCD', 'McDonald''s Corporation', 'Consumer Discretionary', 'Large', 'NYSE'),
('SBUX', 'Starbucks Corporation', 'Consumer Discretionary', 'Large', 'NASDAQ'),
('NKE', 'NIKE Inc', 'Consumer Discretionary', 'Large', 'NYSE'),
('DIS', 'Walt Disney Company', 'Communication Services', 'Large', 'NYSE'),
('XOM', 'Exxon Mobil Corporation', 'Energy', 'Large', 'NYSE'),
('CVX', 'Chevron Corporation', 'Energy', 'Large', 'NYSE'),
('COP', 'ConocoPhillips', 'Energy', 'Large', 'NYSE'),
('BA', 'Boeing Company', 'Industrials', 'Large', 'NYSE'),
('CAT', 'Caterpillar Inc', 'Industrials', 'Large', 'NYSE'),
('MMM', '3M Company', 'Industrials', 'Large', 'NYSE'),
('SPY', 'SPDR S&P 500 ETF Trust', 'ETF', 'Large', 'NYSE');

-- Link stocks to appropriate universe lists
-- Default list gets all stocks
INSERT INTO universe_list_stocks (list_id, symbol)
SELECT 
  (SELECT id FROM universe_lists WHERE name = 'Default Momentum Universe'),
  symbol
FROM stock_universe;

-- S&P 500 list gets large cap stocks (excluding ETFs)
INSERT INTO universe_list_stocks (list_id, symbol)
SELECT 
  (SELECT id FROM universe_lists WHERE name = 'S&P 500 Large Caps'),
  symbol
FROM stock_universe 
WHERE market_cap_tier = 'Large' AND sector != 'ETF';

-- Tech list gets technology stocks
INSERT INTO universe_list_stocks (list_id, symbol)
SELECT 
  (SELECT id FROM universe_lists WHERE name = 'Tech Growth Stocks'),
  symbol
FROM stock_universe 
WHERE sector = 'Technology';

-- Healthcare list gets healthcare stocks
INSERT INTO universe_list_stocks (list_id, symbol)
SELECT 
  (SELECT id FROM universe_lists WHERE name = 'Healthcare Innovation'),
  symbol
FROM stock_universe 
WHERE sector = 'Healthcare';

-- Enable RLS on all tables
ALTER TABLE stock_universe ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE universe_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE universe_list_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist_stocks ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (allows all operations for now, ready for future auth)

-- Public read access to stock universe and public lists
CREATE POLICY "Public read access to stock universe" ON stock_universe 
  FOR SELECT USING (TRUE);

CREATE POLICY "Public read access to public universe lists" ON universe_lists 
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Public read access to universe list stocks" ON universe_list_stocks 
  FOR SELECT USING (
    list_id IN (SELECT id FROM universe_lists WHERE is_public = TRUE)
  );

CREATE POLICY "Public read access to screening results" ON screening_results 
  FOR SELECT USING (TRUE);

CREATE POLICY "Public read access to stock performance" ON stock_performance 
  FOR SELECT USING (TRUE);

-- For authenticated users (when you add auth), allow full CRUD
CREATE POLICY "Authenticated users can manage stock universe" ON stock_universe 
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage screening results" ON screening_results 
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage their lists" ON universe_lists 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    (is_public = TRUE OR created_by = auth.uid() OR created_by IS NULL)
  );

CREATE POLICY "Authenticated users can manage list stocks" ON universe_list_stocks 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    list_id IN (
      SELECT id FROM universe_lists 
      WHERE is_public = TRUE OR created_by = auth.uid() OR created_by IS NULL
    )
  );

CREATE POLICY "Users can manage their watchlists" ON user_watchlists 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their watchlist stocks" ON user_watchlist_stocks 
  FOR ALL USING (
    watchlist_id IN (SELECT id FROM user_watchlists WHERE user_id = auth.uid())
  );

-- Service role can bypass all RLS (for n8n workflows)
-- No additional policies needed - service role bypasses RLS automatically

-- Create a function to get stocks for screening (useful for frontend)
CREATE OR REPLACE FUNCTION get_screening_universe(list_name TEXT DEFAULT 'Default Momentum Universe')
RETURNS TABLE (
  symbol TEXT,
  name TEXT,
  sector TEXT,
  market_cap_tier TEXT,
  exchange TEXT,
  is_active BOOLEAN
) 
LANGUAGE sql
SECURITY DEFINER
AS $
  SELECT 
    su.symbol,
    su.name,
    su.sector,
    su.market_cap_tier,
    su.exchange,
    su.is_active
  FROM stock_universe su
  JOIN universe_list_stocks uls ON su.symbol = uls.symbol
  JOIN universe_lists ul ON uls.list_id = ul.id
  WHERE ul.name = list_name 
    AND su.is_active = TRUE
  ORDER BY su.symbol;
$;