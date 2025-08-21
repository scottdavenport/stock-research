# Stock Screener Webhook Integration Update

## Context
We have an n8n workflow that performs stock screening and now saves results to Supabase with user association. The webhook endpoint has been updated to require user email and store screening sessions.

## Database Schema Requirements

**Run these SQL statements in Supabase to set up the required tables:**

```sql
-- Add screening sessions table to track user screening requests
CREATE TABLE user_screening_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  screening_type TEXT DEFAULT 'full_universe',
  filters JSONB,
  total_stocks_screened INTEGER DEFAULT 0,
  total_buy_rated INTEGER DEFAULT 0,
  buy_percentage DECIMAL(5,2) DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  average_buy_score DECIMAL(5,2) DEFAULT 0,
  processing_time_seconds INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  session_data JSONB
);

-- Update existing screening_results table
ALTER TABLE screening_results 
ADD COLUMN session_id UUID REFERENCES user_screening_sessions(id) ON DELETE CASCADE,
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_user_screening_sessions_user_id ON user_screening_sessions(user_id);
CREATE INDEX idx_user_screening_sessions_email ON user_screening_sessions(user_email);
CREATE INDEX idx_user_screening_sessions_created_at ON user_screening_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE user_screening_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own screening sessions" ON user_screening_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own screening sessions" ON user_screening_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Helper function
CREATE OR REPLACE FUNCTION create_screening_session(
  p_user_email TEXT,
  p_filters JSONB DEFAULT '{}',
  p_screening_type TEXT DEFAULT 'full_universe'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_session_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_user_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', p_user_email;
  END IF;
  
  INSERT INTO user_screening_sessions (
    user_id, 
    user_email, 
    screening_type, 
    filters,
    status
  ) VALUES (
    v_user_id, 
    p_user_email, 
    p_screening_type, 
    p_filters,
    'running'
  ) RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$;
```

## Webhook API Changes

### Updated Request Format
The webhook now requires a user email and has updated the request structure:

**Endpoint:** `POST /webhook/3928ca93-6c9c-4b25-ba34-3d6991245531`

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Body:**
```json
{
  "userEmail": "user@example.com",
  "sector": "Technology",
  "marketCap": "Large", 
  "minScore": 70
}
```

### Response Format
The response now includes session tracking information:

```json
{
  "success": true,
  "timestamp": "2025-08-17T10:30:00Z",
  "sessionId": "uuid-of-session",
  "userEmail": "user@example.com",
  "summary": {
    "totalScreened": 150,
    "totalBuyRated": 23,
    "buyPercentage": 15.3,
    "processingTime": "45 seconds",
    "processingTimeSeconds": 45,
    "averageScore": 58.2,
    "averageBuyScore": 74.1,
    "filters": {
      "sector": "Technology",
      "marketCap": "Large",
      "minScore": 70,
      "fullUniverseScreen": true
    },
    "allRatings": {
      "strongBuy": 5,
      "buy": 12,
      "weakBuy": 6,
      "hold": 45,
      "avoid": 82
    },
    "buyRatedBreakdown": {
      "strongBuy": 5,
      "buy": 12,
      "weakBuy": 6
    },
    "sectorBreakdown": {
      "Technology": 23
    },
    "exchangeBreakdown": {
      "NASDAQ": 18,
      "NYSE": 5
    },
    "marketCapBreakdown": {
      "Large": 23
    }
  },
  "results": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc",
      "sector": "Technology",
      "exchange": "NASDAQ",
      "marketCapTier": "Large",
      "country": "US",
      "score": 87,
      "rating": "STRONG BUY",
      "price": 175.25,
      "changePercent": 2.3,
      "marketCap": 2800000,
      "peRatio": 28.5,
      "week52High": 180.50,
      "distanceFrom52High": "97.1",
      "rank": 1,
      "scoreBreakdown": {
        "momentum": 35,
        "quality": 28,
        "technical": 24
      },
      "dataSource": {
        "company": "Supabase",
        "pricing": "Finnhub",
        "fundamentals": "Finnhub"
      }
    }
  ],
  "metadata": {
    "dataSource": "Supabase + Finnhub",
    "workflowVersion": "4.0",
    "apiVersion": "full-universe-with-supabase",
    "totalStocksAnalyzed": 150,
    "filteredToBuyRatings": true
  }
}
```

## Frontend Implementation Requirements

### 1. Update API Call Function
Modify your existing API call to include the user's email:

```javascript
// Update your screening API call
const triggerScreening = async (filters) => {
  const response = await fetch('/api/screen-stocks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
    },
    body: JSON.stringify({
      userEmail: user.email, // Add this line
      ...filters
    })
  });
  
  return response.json();
};
```

### 2. Handle Session Tracking
Store and display session information in your UI:

```javascript
// After successful screening
const handleScreeningResult = (result) => {
  if (result.success) {
    // Store session ID for future reference
    setLastSessionId(result.sessionId);
    
    // Display results with session info
    setScreeningResults(result.results);
    setScreeningSummary(result.summary);
    
    // Optional: Show success message with session tracking
    toast.success(`Screening completed! Session: ${result.sessionId.slice(0, 8)}...`);
  }
};
```

### 3. User Authentication Context
Ensure you have access to the current user's email:

```javascript
// Make sure your auth context provides user email
const { user } = useAuth(); // Should include user.email
```

### 4. Error Handling
Update error handling for the new validation requirements:

```javascript
const handleScreeningError = (error) => {
  if (error.message?.includes('User email required')) {
    toast.error('Please log in to run stock screening');
    router.push('/login');
  } else if (error.message?.includes('not found')) {
    toast.error('User account not found. Please contact support.');
  } else {
    toast.error('Screening failed. Please try again.');
  }
};
```

## Existing Database Tables Context

Your app already has these tables that will work with the new system:

- `stock_universe` - Contains the stock symbols and basic info
- `screening_results` - Will now be linked to sessions and users
- `universe_lists` - Different screening groups
- `universe_list_stocks` - Junction table for stock lists

## Environment Variables Needed

Ensure these are set in your environment:

```env
NEXT_PUBLIC_API_KEY=your_screening_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## Implementation Steps

1. **Run the SQL statements** in Supabase SQL editor
2. **Update your API call function** to include userEmail
3. **Modify your screening trigger** to pass user email
4. **Update result handling** to use sessionId
5. **Test the integration** with a logged-in user
6. **Add error handling** for authentication failures

## Testing

Test with this curl command:

```bash
curl -X POST "https://your-n8n-instance.com/webhook/3928ca93-6c9c-4b25-ba34-3d6991245531" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "sector": "Technology",
    "marketCap": "Large"
  }'
```

This should now create a session in Supabase, run the screening, and return results with session tracking.