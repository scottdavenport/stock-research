# Database Polling Implementation for Async Stock Screening

## Overview

This implementation provides a robust polling system for handling asynchronous stock screening results. When users trigger a screening, the app sends a webhook to the n8n workflow, which creates a session and returns a `sessionId` immediately. The app then polls the database every 10 seconds to check for completion.

## Architecture

### Database Schema

The required database tables already exist in your Supabase instance:

#### `user_screening_sessions` Table ✅ (Already Exists)
- `id` (UUID) - Primary key, session identifier
- `user_email` (TEXT) - User's email address
- `status` (TEXT) - 'pending', 'processing', 'running', 'completed', 'failed', 'replaced'
- `total_stocks_screened` (INTEGER) - Number of stocks processed
- `total_buy_rated` (INTEGER) - Number of buy-rated stocks
- `buy_percentage` (NUMERIC) - Percentage of buy-rated stocks
- `average_score` (NUMERIC) - Average score across all stocks
- `processing_time_seconds` (INTEGER) - Total processing time
- `created_at` (TIMESTAMPTZ) - Session creation timestamp
- `completed_at` (TIMESTAMPTZ) - Session completion timestamp
- `filters` (JSONB) - Original screening parameters
- `screening_type` (TEXT) - Type of screening performed

#### `screening_results` Table ✅ (Already Exists)
- `session_id` (UUID) - Foreign key to user_screening_sessions
- `rank_position` (INTEGER) - Ranking position of the result
- All other required fields for stock results

### Components

#### 1. `useScreeningResults` Hook (`src/hooks/useScreeningResults.ts`)
- **Purpose**: Custom React hook for polling screening results
- **Features**:
  - Polls every 10 seconds during 'pending', 'processing', or 'running' states
  - Stops polling when status is 'completed', 'failed', or 'replaced'
  - Handles loading states and errors gracefully
  - Implements 15-minute timeout
  - Automatic cleanup on component unmount

#### 2. `ScreeningResultsWithPolling` Component (`src/components/ScreeningResultsWithPolling.tsx`)
- **Purpose**: Displays screening results with real-time polling
- **Features**:
  - Shows different states (pending, processing, running, completed, failed, replaced)
  - Real-time progress indicators
  - Summary statistics cards
  - Sortable and filterable results table
  - CSV export functionality
  - Error handling with retry option

#### 3. API Route (`src/app/api/stock-screening/route.ts`)
- **Purpose**: Proxies requests to the n8n workflow
- **Features**:
  - Validates user authentication
  - Sends webhook to n8n workflow
  - Returns sessionId from n8n response for polling

## User Flow

1. **User submits screening form** → App sends webhook to n8n workflow
2. **n8n workflow creates session** → Returns sessionId immediately
3. **App receives sessionId** → Starts polling database
4. **Polling begins** → Hook checks status every 10 seconds
5. **Progress updates** → UI shows current status and progress
6. **Completion** → Results displayed with filtering/sorting options
7. **Export** → User can download results as CSV

## Technical Details

### n8n Workflow Integration

The n8n workflow (`Stock Screener 4`) handles:
- **Session Creation**: Creates session in database via `upsert_screening_session` RPC
- **Stock Processing**: Fetches and analyzes all stocks from Supabase
- **Results Storage**: Saves results to `screening_results` table with `session_id`
- **Immediate Response**: Returns sessionId via "Early Success Response" node

### Polling Configuration
- **Interval**: 10 seconds
- **Timeout**: 15 minutes (90 attempts)
- **States**: pending → processing/running → completed/failed/replaced

### Error Handling
- Network errors during polling
- Session not found (invalid sessionId)
- Database connection issues
- Timeout after 15 minutes

### Performance Considerations
- Efficient database queries with proper indexing
- Automatic cleanup of polling intervals
- Optimized re-renders during polling
- Graceful error recovery

## Database Queries

### Session Status Query
```sql
SELECT 
  id, status, total_stocks_screened, total_buy_rated, 
  buy_percentage, average_score, processing_time_seconds,
  created_at, completed_at, screening_type, filters
FROM user_screening_sessions 
WHERE id = ? AND user_email = ?
```

### Results Query (when completed)
```sql
SELECT 
  sr.symbol, sr.score, sr.rating, sr.price, sr.change_percent,
  sr.rank_position, sr.score_breakdown, su.name, su.sector
FROM screening_results sr
JOIN stock_universe su ON sr.symbol = su.symbol  
WHERE sr.session_id = ?
ORDER BY sr.rank_position ASC
```

## Migration Status

✅ **No migration required** - All necessary tables and columns already exist in your Supabase database.

The implementation is ready to use with your existing database schema.

## Usage

### In React Components

```tsx
import { useScreeningResults } from '../hooks/useScreeningResults';

function MyComponent() {
  const { session, results, isLoading, error, isPolling, retry } = 
    useScreeningResults(sessionId, userEmail);
  
  // Component logic...
}
```

### API Integration

```typescript
import { screenStocks } from '../utils/api';

const response = await screenStocks(formData, userEmail);
if (response.success) {
  const sessionId = response.sessionId;
  // Start polling with sessionId
}
```

## n8n Workflow Response Format

The n8n workflow returns this format immediately:

```json
{
  "success": true,
  "message": "Stock screening started successfully",
  "sessionId": "uuid-from-database",
  "userEmail": "user@example.com",
  "status": "processing",
  "estimatedDuration": "5-10 minutes",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "pollEndpoint": "Check your database for results using the sessionId"
}
```

## Benefits

1. **Better UX**: Users get immediate feedback and can see progress
2. **Scalability**: Handles long-running screening processes
3. **Reliability**: Robust error handling and retry mechanisms
4. **Flexibility**: Easy to extend with additional features
5. **Performance**: Efficient polling with proper cleanup

## Future Enhancements

- WebSocket support for real-time updates
- Progress percentage calculation
- Email notifications when screening completes
- Session history and management
- Batch processing for multiple screenings
