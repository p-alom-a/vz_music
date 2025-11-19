-- Test script to diagnose the 40 results limit issue
-- Run this in Supabase SQL Editor

-- First, check which search_albums functions exist
SELECT
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'search_albums'
AND n.nspname = 'public';

-- Test: Call the function directly with k=133 (matching your log)
-- Use a random album's embedding as the query
WITH test_embedding AS (
    SELECT embedding FROM album_covers LIMIT 1
)
SELECT COUNT(*) as actual_count
FROM search_albums(
    query_embedding := (SELECT embedding FROM test_embedding),
    match_count := 133,
    filter_genre := NULL,
    filter_year_min := 1952,
    filter_year_max := 2024
);

-- Test with different k values to find the limit
-- k=40
WITH test_embedding AS (SELECT embedding FROM album_covers LIMIT 1)
SELECT COUNT(*) as count_k40
FROM search_albums((SELECT embedding FROM test_embedding), 40);

-- k=50
WITH test_embedding AS (SELECT embedding FROM album_covers LIMIT 1)
SELECT COUNT(*) as count_k50
FROM search_albums((SELECT embedding FROM test_embedding), 50);

-- k=100
WITH test_embedding AS (SELECT embedding FROM album_covers LIMIT 1)
SELECT COUNT(*) as count_k100
FROM search_albums((SELECT embedding FROM test_embedding), 100);

-- k=200
WITH test_embedding AS (SELECT embedding FROM album_covers LIMIT 1)
SELECT COUNT(*) as count_k200
FROM search_albums((SELECT embedding FROM test_embedding), 200);

-- Check if there's a PostgREST or connection limit
SHOW max_rows;

-- Check all relevant PostgreSQL settings
SELECT name, setting, unit, short_desc
FROM pg_settings
WHERE name IN (
    'max_rows',
    'default_transaction_read_only',
    'statement_timeout',
    'idle_in_transaction_session_timeout'
);
