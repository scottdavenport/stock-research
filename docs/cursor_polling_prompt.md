# Implement Database Polling for Async Stock Screening Results

## Context
I have a stock screening workflow that runs asynchronously via n8n. When a user triggers a screening, they get a `sessionId` immediately, but the actual screening takes 5-10 minutes to complete. I need to implement polling in my React app to check for results and display them when ready.

## Database Schema
The workflow saves data to two main tables:

### `user_screening_sessions` table:
- `id` (UUID) - the session ID returned to user
- `user_email` (TEXT) 
- `status` (TEXT) - 'pending', 'processing', 'completed', 'failed'
- `total_stocks_screened` (INTEGER)
- `total_buy_rated` (INTEGER) 
- `buy_percentage` (NUMERIC)
- `average_score` (NUMERIC)
- `processing_time_seconds` (INTEGER)
- `created_at` (TIMESTAMPTZ)
- `completed_at` (TIMESTAMPTZ)

### `screening_results` table:
- `id` (UUID)
- `session_id` (UUID) - foreign key to user_screening_sessions.id
- `symbol` (TEXT)
- `score` (INTEGER) - 0-100
- `rating` (TEXT) - 'STRONG BUY', 'BUY', 'WEAK BUY', 'HOLD', 'WEAK SELL', 'SELL', 'STRONG SELL'
- `price` (NUMERIC)
- `change_percent` (NUMERIC)
- `rank_position` (INTEGER)
- `score_breakdown` (JSONB) - {momentum: 32, quality: 28, technical: 15}
- `created_at` (TIMESTAMPTZ)

## Requirements

### 1. Polling Hook
Create a custom React hook `useScreeningResults(sessionId, userEmail)` that:
- Polls the database every 10 seconds when status is 'pending' or 'processing'
- Stops polling when status is 'completed' or 'failed'
- Returns the session status, summary data, and results array
- Handles loading states and errors gracefully
- Uses Supabase client for database queries

### 2. Query Structure
The polling should fetch:
```sql
-- Session status and summary
SELECT 
  id, status, total_stocks_screened, total_buy_rated, 
  buy_percentage, average_score, processing_time_seconds,
  created_at, completed_at
FROM user_screening_sessions 
WHERE id = ? AND user_email = ?

-- Results (only when completed)
SELECT 
  sr.symbol, sr.score, sr.rating, sr.price, sr.change_percent,
  sr.rank_position, sr.score_breakdown, su.name, su.sector
FROM screening_results sr
JOIN stock_universe su ON sr.symbol = su.symbol  
WHERE sr.session_id = ?
ORDER BY sr.rank_position ASC
```

### 3. Component Implementation
Create a `ScreeningResults` component that:
- Takes `sessionId` and `userEmail` as props
- Shows different states:
  - **Pending/Processing**: Loading spinner with progress message
  - **Completed**: Summary stats + results table/cards
  - **Failed**: Error message with retry option
- Displays a real-time progress indicator during processing
- Shows summary statistics (total screened, buy percentage, avg score)
- Renders results in a sortable table or card layout

### 4. UI Features
- **Progress States**: "Initializing...", "Processing stocks...", "Completed"
- **Summary Cards**: Total screened, Buy-rated count, Average score
- **Results Table**: Symbol, Company, Score, Rating, Price, Change%, Sector
- **Filtering**: Filter by rating (Buy/Hold/Sell), score range, sector
- **Sorting**: Sort by score, rating, price change, alphabetical
- **Export**: Button to export results to CSV

### 5. Error Handling
- Network errors during polling
- Session not found (invalid sessionId)
- Timeout after 15 minutes of polling
- Database connection issues

### 6. Performance Considerations
- Use React Query or SWR for efficient polling and caching
- Implement exponential backoff if requests fail
- Cancel polling when component unmounts
- Optimize re-renders during polling

## Technical Details
- **Supabase URL**: Use environment variable `NEXT_PUBLIC_SUPABASE_URL`
- **Supabase Anon Key**: Use environment variable `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Polling Interval**: 10 seconds during processing, stop when completed
- **Timeout**: Stop polling after 15 minutes and show timeout message
- **Framework**: Next.js with TypeScript

## Expected User Flow
1. User triggers screening → gets sessionId immediately
2. App shows "Processing..." with polling status
3. Every 10 seconds, check if status = 'completed'
4. When completed, fetch and display all results
5. User can filter, sort, and export the results

## Sample Return Data Structure
```typescript
interface ScreeningSession {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalStocksScreened: number;
  totalBuyRated: number;
  buyPercentage: number;
  averageScore: number;
  processingTimeSeconds: number;
  createdAt: string;
  completedAt?: string;
}

interface ScreeningResult {
  symbol: string;
  name: string;
  score: number;
  rating: string;
  price: number;
  changePercent: number;
  sector: string;
  rankPosition: number;
  scoreBreakdown: {
    momentum: number;
    quality: number;
    technical: number;
  };
}
```

Please implement this polling system with proper TypeScript types, error boundaries, and a clean, responsive UI. Focus on user experience during the waiting period and make the results presentation engaging and actionable.