-- Update the search_albums RPC function to support year range filtering
-- Run this SQL in your Supabase SQL Editor

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
