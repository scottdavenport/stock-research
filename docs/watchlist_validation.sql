-- Watchlist Validation Queries
-- Run these queries to validate that the watchlist functionality is properly set up

-- 1. Check if watchlist functions exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_or_create_default_watchlist',
    'add_to_watchlist', 
    'remove_from_watchlist',
    'get_watchlist_with_latest_data',
    'is_stock_watched'
)
ORDER BY routine_name;

-- 2. Check if watchlist tables exist and have correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('user_watchlists', 'user_watchlist_stocks')
ORDER BY table_name, ordinal_position;

-- 3. Check if RLS is enabled on watchlist tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_watchlists', 'user_watchlist_stocks');

-- 4. Check RLS policies on watchlist tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_watchlists', 'user_watchlist_stocks')
ORDER BY tablename, policyname;

-- 5. Check if there are any existing watchlists
SELECT 
    id,
    name,
    description,
    user_id,
    created_at,
    updated_at
FROM user_watchlists 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Check if there are any existing watchlist stocks
SELECT 
    wls.watchlist_id,
    wls.symbol,
    wls.added_at,
    wls.notes,
    wl.name as watchlist_name
FROM user_watchlist_stocks wls
JOIN user_watchlists wl ON wls.watchlist_id = wl.id
ORDER BY wls.added_at DESC 
LIMIT 10;

-- 7. Test the get_or_create_default_watchlist function (replace with your email)
-- SELECT get_or_create_default_watchlist('your-email@example.com');

-- 8. Test the add_to_watchlist function (replace with your email and a stock symbol)
-- SELECT add_to_watchlist('your-email@example.com', 'AAPL', 'Test stock');

-- 9. Test the is_stock_watched function (replace with your email and stock symbol)
-- SELECT is_stock_watched('your-email@example.com', 'AAPL');

-- 10. Test the get_watchlist_with_latest_data function (replace with your email)
-- SELECT * FROM get_watchlist_with_latest_data('your-email@example.com');

-- 11. Check function permissions
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_or_create_default_watchlist',
    'add_to_watchlist', 
    'remove_from_watchlist',
    'get_watchlist_with_latest_data',
    'is_stock_watched'
);

-- 12. Check if stock_universe table has data (needed for watchlist to work)
SELECT 
    symbol,
    name,
    sector
FROM stock_universe 
ORDER BY symbol 
LIMIT 10;

-- 13. Check if screening_results table has data (for latest data function)
SELECT 
    symbol,
    score,
    rating,
    screening_date,
    created_at
FROM screening_results 
ORDER BY created_at DESC 
LIMIT 10;

-- 14. Count total watchlists and watchlist stocks
SELECT 
    'Total Watchlists' as metric,
    COUNT(*) as count
FROM user_watchlists
UNION ALL
SELECT 
    'Total Watchlist Stocks' as metric,
    COUNT(*) as count
FROM user_watchlist_stocks;
