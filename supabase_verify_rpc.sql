-- Script to verify and potentially fix the search_albums RPC function
-- Run this in your Supabase SQL Editor to diagnose the 40 results issue

-- Step 1: Check if the function exists and view its definition
SELECT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'search_albums'
AND n.nspname = 'public';

-- Step 2: Test the function with different match_count values
-- This will help us see if there's a hidden limit

-- Test with k=10
SELECT COUNT(*) as result_count_10
FROM search_albums(
    query_embedding := (SELECT embedding FROM album_covers LIMIT 1),
    match_count := 10
);

-- Test with k=40
SELECT COUNT(*) as result_count_40
FROM search_albums(
    query_embedding := (SELECT embedding FROM album_covers LIMIT 1),
    match_count := 40
);

-- Test with k=100
SELECT COUNT(*) as result_count_100
FROM search_albums(
    query_embedding := (SELECT embedding FROM album_covers LIMIT 1),
    match_count := 100
);

-- Test with k=500
SELECT COUNT(*) as result_count_500
FROM search_albums(
    query_embedding := (SELECT embedding FROM album_covers LIMIT 1),
    match_count := 500
);

-- Step 3: Check if there are any limits set in Supabase configuration
-- Check PostgREST configuration
SELECT name, setting
FROM pg_settings
WHERE name LIKE '%limit%' OR name LIKE '%max%';

-- Step 4: Recreate the function to ensure it's correct
CREATE OR REPLACE FUNCTION search_albums(
  query_embedding vector(512),
  match_count int,
  filter_genre text DEFAULT NULL,
  filter_year_min int DEFAULT NULL,
  filter_year_max int DEFAULT NULL
)
RETURNS TABLE (
  id text,
  artist text,
  album_name text,
  genre text,
  release_year int,
  pitchfork_score numeric,
  cover_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    album_covers.id,
    album_covers.artist,
    album_covers.album_name,
    album_covers.genre,
    album_covers.release_year,
    album_covers.pitchfork_score,
    album_covers.cover_url,
    1 - (album_covers.embedding <=> query_embedding) as similarity
  FROM album_covers
  WHERE
    (filter_genre IS NULL OR album_covers.genre = filter_genre)
    AND (filter_year_min IS NULL OR album_covers.release_year >= filter_year_min)
    AND (filter_year_max IS NULL OR album_covers.release_year <= filter_year_max)
  ORDER BY album_covers.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 5: Grant execute permission
GRANT EXECUTE ON FUNCTION search_albums TO anon, authenticated, service_role;
