-- FIX: Drop the old search_albums function that has the wrong signature
-- The issue is there are TWO search_albums functions in Supabase:
-- 1. Old version: (query_embedding, match_threshold, match_count=10, filter_genre)
-- 2. New version: (query_embedding, match_count, filter_genre, filter_year_min, filter_year_max)
--
-- PostgreSQL is calling the old one with DEFAULT match_count=10, which limits results!

-- Step 1: Drop BOTH versions to clean up
DROP FUNCTION IF EXISTS public.search_albums(vector, double precision, integer, text);
DROP FUNCTION IF EXISTS public.search_albums(vector, integer, text, integer, integer);

-- Step 2: Recreate ONLY the correct version (with year filters, NO match_threshold)
CREATE OR REPLACE FUNCTION public.search_albums(
  query_embedding vector(512),
  match_count integer,
  filter_genre text DEFAULT NULL,
  filter_year_min integer DEFAULT NULL,
  filter_year_max integer DEFAULT NULL
)
RETURNS TABLE (
  id text,
  artist text,
  album_name text,
  genre text,
  release_year integer,
  pitchfork_score numeric,
  best_new_music boolean,
  cover_url text,
  similarity double precision
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
    album_covers.best_new_music,
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

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.search_albums(vector, integer, text, integer, integer) TO anon, authenticated, service_role;

-- Step 4: Verify only one function exists
SELECT
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'search_albums'
AND n.nspname = 'public';

-- Expected output: Only ONE function with signature:
-- search_albums(query_embedding vector, match_count integer, filter_genre text, filter_year_min integer, filter_year_max integer)
