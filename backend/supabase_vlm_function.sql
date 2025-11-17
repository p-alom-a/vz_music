-- Supabase RPC function for VLM semantic search
-- This function performs vector similarity search on VLM embeddings

CREATE OR REPLACE FUNCTION search_albums_vlm(
  query_embedding vector(384),
  match_count int DEFAULT 10,
  filter_warnings boolean DEFAULT false,
  filter_genre text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  artist text,
  album_name text,
  genre text,
  release_year int,
  pitchfork_score float,
  best_new_music boolean,
  cover_url text,
  vlm_description text,
  vlm_warning text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.id,
    ac.artist,
    ac.album_name,
    ac.genre,
    ac.release_year,
    ac.pitchfork_score,
    ac.best_new_music,
    ac.cover_url,
    ac.vlm_description,
    ac.vlm_warning,
    1 - (ac.vlm_embedding <=> query_embedding) as similarity
  FROM album_covers ac
  WHERE ac.vlm_processed = TRUE
    AND (NOT filter_warnings OR ac.vlm_warning IS NULL)
    AND (filter_genre IS NULL OR ac.genre = filter_genre)
  ORDER BY ac.vlm_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Example usage:
-- SELECT * FROM search_albums_vlm(
--   '[0.1, 0.2, 0.3, ...]'::vector(384),  -- query embedding
--   10,                                     -- match_count
--   false,                                  -- filter_warnings
--   NULL                                    -- filter_genre (NULL = all genres)
-- );

-- To apply genre filter:
-- SELECT * FROM search_albums_vlm(
--   '[0.1, 0.2, 0.3, ...]'::vector(384),
--   10,
--   false,
--   'Rock'
-- );
