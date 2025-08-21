# Watch List Feature - Product Requirements Document

**Version**: 1.0  
**Date**: August 21, 2025  
**Goal**: Add watch list functionality to save and track favorite stocks from screening results  
**Target**: Enable users to curate and monitor their most promising stock opportunities

---

## Problem Statement

Users identify promising stocks during screening sessions but currently have no way to save or track them for future reference. Without a watch list feature, users must:
- Re-run screens to find previously interesting stocks
- Manually track stocks outside the application
- Lose context about why a stock was originally flagged

## Success Criteria

- One-click saving of stocks from screening results
- Persistent watch list that survives across sessions (until manually removed)
- Clear visual indicators for stocks already on watch list
- Easy removal of stocks from watch list
- Display latest screening data for watched stocks
- Auto-suggest high-scoring stocks (85+) for watch list addition
- Header navigation access to watch list page

---

## Required Database Functions

The existing schema already includes the necessary watch list tables (`user_watchlists` and `user_watchlist_stocks`). We need to create the following SQL functions:

### 1. Get or Create Default Watchlist
```sql
CREATE OR REPLACE FUNCTION get_or_create_default_watchlist(p_user_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    watchlist_uuid UUID;
BEGIN
    -- Try to find existing default watchlist
    SELECT id INTO watchlist_uuid
    FROM user_watchlists 
    WHERE user_id IS NULL 
    AND name = CONCAT('My Watch List - ', p_user_email)
    LIMIT 1;
    
    -- Create if doesn't exist
    IF watchlist_uuid IS NULL THEN
        INSERT INTO user_watchlists (name, description, user_id)
        VALUES (
            CONCAT('My Watch List - ', p_user_email),
            'Default watch list for tracking favorite stocks',
            NULL
        )
        RETURNING id INTO watchlist_uuid;
    END IF;
    
    RETURN watchlist_uuid;
END;
$$;
```

### 2. Add Stock to Watchlist
```sql
CREATE OR REPLACE FUNCTION add_to_watchlist(
    p_user_email TEXT,
    p_symbol TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    watchlist_uuid UUID;
BEGIN
    watchlist_uuid := get_or_create_default_watchlist(p_user_email);
    
    INSERT INTO user_watchlist_stocks (watchlist_id, symbol, notes)
    VALUES (watchlist_uuid, p_symbol, p_notes)
    ON CONFLICT (watchlist_id, symbol) DO NOTHING;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;
```

### 3. Remove Stock from Watchlist
```sql
CREATE OR REPLACE FUNCTION remove_from_watchlist(
    p_user_email TEXT,
    p_symbol TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    watchlist_uuid UUID;
BEGIN
    watchlist_uuid := get_or_create_default_watchlist(p_user_email);
    
    DELETE FROM user_watchlist_stocks 
    WHERE watchlist_id = watchlist_uuid AND symbol = p_symbol;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;
```

### 4. Get Watch List with Latest Screening Data
```sql
CREATE OR REPLACE FUNCTION get_watchlist_with_latest_data(p_user_email TEXT)
RETURNS TABLE (
    symbol TEXT,
    company_name TEXT,
    sector TEXT,
    added_at TIMESTAMPTZ,
    notes TEXT,
    latest_score INTEGER,
    latest_rating TEXT,
    latest_price NUMERIC,
    latest_change_percent NUMERIC,
    latest_screening_date DATE,
    rank_position INTEGER
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH user_watchlist AS (
        SELECT id as watchlist_id
        FROM user_watchlists 
        WHERE user_id IS NULL 
        AND name = CONCAT('My Watch List - ', p_user_email)
        LIMIT 1
    ),
    latest_screening_results AS (
        SELECT DISTINCT ON (sr.symbol) 
            sr.symbol,
            sr.score,
            sr.rating,
            sr.price,
            sr.change_percent,
            sr.screening_date,
            sr.rank_position
        FROM screening_results sr
        ORDER BY sr.symbol, sr.screening_date DESC, sr.created_at DESC
    )
    SELECT 
        uws.symbol,
        su.name as company_name,
        su.sector,
        uws.added_at,
        uws.notes,
        lsr.score as latest_score,
        lsr.rating as latest_rating,
        lsr.price as latest_price,
        lsr.change_percent as latest_change_percent,
        lsr.screening_date as latest_screening_date,
        lsr.rank_position
    FROM user_watchlist uw
    JOIN user_watchlist_stocks uws ON uw.watchlist_id = uws.watchlist_id
    JOIN stock_universe su ON uws.symbol = su.symbol
    LEFT JOIN latest_screening_results lsr ON uws.symbol = lsr.symbol
    ORDER BY uws.added_at DESC;
$$;
```

### 5. Check if Stock is Watched
```sql
CREATE OR REPLACE FUNCTION is_stock_watched(
    p_user_email TEXT,
    p_symbol TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    watchlist_uuid UUID;
    is_watched BOOLEAN := FALSE;
BEGIN
    watchlist_uuid := get_or_create_default_watchlist(p_user_email);
    
    SELECT EXISTS(
        SELECT 1 FROM user_watchlist_stocks 
        WHERE watchlist_id = watchlist_uuid AND symbol = p_symbol
    ) INTO is_watched;
    
    RETURN is_watched;
END;
$$;
```

---

## Frontend Implementation Steps

### 1. Header Navigation
- Add "Watch List" link to main navigation header
- Include star icon and optional count badge showing number of tracked stocks
- Link should navigate to `/watchlist` route

### 2. Screening Results Table Updates
- Add star icon button in each stock row (next to existing research button)
- Button should toggle between filled (purple) and empty (gray) states
- Implement `WatchListButton` component with loading states
- Show toast notifications on successful add/remove actions
- Load watched stocks on page load to set initial button states

### 3. Auto-Suggestion Modal
- After screening completes, check for stocks with score >= 85
- Show modal suggesting these high-scoring stocks for watch list
- Modal should list stock symbols, names, and scores
- Provide "Add All" and "Maybe Later" options
- Only show stocks not already in watch list

### 4. Watch List Page
- Create new `/watchlist` route and page component
- Display empty state when no stocks are tracked
- Show table with: Symbol, Company, Score, Rating, Price, Change %, Added Date
- Include sorting options (by score, date added, alphabetical)
- Add bulk selection and removal capabilities
- Include CSV export functionality
- Show latest screening data for each stock (with indicators if data is stale)

### 5. API Integration
- Create utility functions for:
  - `toggleWatchList(symbol, userEmail, action)` - add/remove stocks
  - `fetchWatchList(userEmail)` - get complete watch list with latest data
  - `getWatchedStocks(userEmail)` - get array of watched symbols
  - `bulkAddToWatchList(symbols, userEmail)` - add multiple stocks
- All functions should call the Supabase RPC endpoints created above
- Implement proper error handling and loading states

### 6. State Management
- Track watched stocks in screening results page
- Update watch list count in header navigation
- Manage loading states for individual buttons and bulk operations
- Handle optimistic updates with rollback on errors

---

## User Experience Flow

### Adding Stocks
1. User reviews screening results
2. Clicks star icon next to promising stocks
3. Icon fills purple and shows toast confirmation
4. High-scoring stocks (85+) are automatically suggested via modal

### Viewing Watch List
1. User clicks "Watch List" in header navigation
2. See all saved stocks with latest screening data
3. Empty state shows call-to-action to run screening
4. Stocks display current performance and screening metrics

### Managing Watch List
1. Remove individual stocks via star icons or remove buttons
2. Bulk select and remove multiple stocks
3. Sort and filter by various criteria
4. Export to CSV for external tracking

---

## Technical Notes

- Use email-based user identification (consistent with current screening system)
- Watch list entries persist indefinitely until manually removed
- Always show latest screening result for each watched stock
- Handle gracefully when stocks haven't been screened recently
- Prepare for future expansion to multiple watch lists per user
- Consider pagination if watch lists become very large

---

## Future Enhancements

- Multiple named watch lists (Growth, Value, High-Risk, etc.)
- Notes field for each watched stock
- Price alerts and email notifications
- Performance tracking since addition date
- Watch list sharing between users
- Integration with external portfolio tracking tools