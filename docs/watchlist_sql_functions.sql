-- Watchlist SQL Functions for Supabase
-- Run these functions against your Supabase database to enable watchlist functionality

-- 1. Get or Create Default Watchlist
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

-- 2. Add Stock to Watchlist
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

-- 3. Remove Stock from Watchlist
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

-- 4. Get Watch List with Latest Screening Data
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

-- 5. Check if Stock is Watched
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

-- Grant necessary permissions for the functions
GRANT EXECUTE ON FUNCTION get_or_create_default_watchlist(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION add_to_watchlist(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION remove_from_watchlist(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_watchlist_with_latest_data(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_stock_watched(TEXT, TEXT) TO anon, authenticated;

-- Enable RLS (Row Level Security) on watchlist tables if not already enabled
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist_stocks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_watchlists
CREATE POLICY "Users can view their own watchlists" ON user_watchlists
    FOR SELECT USING (user_id IS NULL);

CREATE POLICY "Users can insert their own watchlists" ON user_watchlists
    FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can update their own watchlists" ON user_watchlists
    FOR UPDATE USING (user_id IS NULL);

-- Create RLS policies for user_watchlist_stocks
CREATE POLICY "Users can view their own watchlist stocks" ON user_watchlist_stocks
    FOR SELECT USING (
        watchlist_id IN (
            SELECT id FROM user_watchlists WHERE user_id IS NULL
        )
    );

CREATE POLICY "Users can insert their own watchlist stocks" ON user_watchlist_stocks
    FOR INSERT WITH CHECK (
        watchlist_id IN (
            SELECT id FROM user_watchlists WHERE user_id IS NULL
        )
    );

CREATE POLICY "Users can update their own watchlist stocks" ON user_watchlist_stocks
    FOR UPDATE USING (
        watchlist_id IN (
            SELECT id FROM user_watchlists WHERE user_id IS NULL
        )
    );

CREATE POLICY "Users can delete their own watchlist stocks" ON user_watchlist_stocks
    FOR DELETE USING (
        watchlist_id IN (
            SELECT id FROM user_watchlists WHERE user_id IS NULL
        )
    );
