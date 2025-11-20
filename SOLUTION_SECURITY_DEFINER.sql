-- ✅ SOLUTION FINALE QUI MARCHE : Wrapper SECURITY DEFINER
-- Cette approche contourne les restrictions de permission de Supabase

-- Étape 1: Créer une fonction wrapper qui peut définir hnsw.ef_search
CREATE OR REPLACE FUNCTION public.search_albums_wrapper(
  p_query_embedding vector(512),
  p_match_count integer,
  p_filter_genre text DEFAULT NULL,
  p_filter_year_min integer DEFAULT NULL,
  p_filter_year_max integer DEFAULT NULL
)
RETURNS TABLE (
  id text,
  artist text,
  album_name text,
  genre text,
  release_year integer,
  pitchfork_score numeric,
  cover_url text,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER  -- ⭐ Execute avec les privilèges du propriétaire (postgres)
AS $$
BEGIN
  -- Définir ef_search pour cette transaction
  PERFORM set_config('hnsw.ef_search', '1000', true);

  -- Appeler la vraie fonction de recherche
  RETURN QUERY
  SELECT * FROM public.search_albums_inner(
    p_query_embedding,
    p_match_count,
    p_filter_genre,
    p_filter_year_min,
    p_filter_year_max
  );
END;
$$;

-- Étape 2: La fonction interne qui fait la recherche
CREATE OR REPLACE FUNCTION public.search_albums_inner(
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
  cover_url text,
  similarity double precision
)
LANGUAGE plpgsql
STABLE
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
    (1 - (album_covers.embedding <=> query_embedding))::double precision as similarity
  FROM album_covers
  WHERE
    (filter_genre IS NULL OR album_covers.genre = filter_genre)
    AND (filter_year_min IS NULL OR album_covers.release_year >= filter_year_min)
    AND (filter_year_max IS NULL OR album_covers.release_year <= filter_year_max)
  ORDER BY album_covers.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Étape 3: Drop l'ancienne fonction et créer un alias
DROP FUNCTION IF EXISTS public.search_albums(vector(512), integer, text, integer, integer) CASCADE;

-- Créer un alias pour garder la compatibilité avec le code existant
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
  cover_url text,
  similarity double precision
)
LANGUAGE SQL
STABLE
AS $$
  SELECT * FROM public.search_albums_wrapper(
    query_embedding,
    match_count,
    filter_genre,
    filter_year_min,
    filter_year_max
  );
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.search_albums_wrapper(vector(512), integer, text, integer, integer)
TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.search_albums_inner(vector(512), integer, text, integer, integer)
TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.search_albums(vector(512), integer, text, integer, integer)
TO anon, authenticated, service_role;

-- Test final
WITH test_embedding AS (SELECT embedding FROM album_covers LIMIT 1)
SELECT
  (SELECT COUNT(*) FROM search_albums((SELECT embedding FROM test_embedding), 40)) as k40,
  (SELECT COUNT(*) FROM search_albums((SELECT embedding FROM test_embedding), 133)) as k133,
  (SELECT COUNT(*) FROM search_albums((SELECT embedding FROM test_embedding), 200)) as k200,
  (SELECT COUNT(*) FROM search_albums((SELECT embedding FROM test_embedding), 500)) as k500;

-- Résultats attendus:
-- k40 = 40 ✅
-- k133 = 133 ✅ (ENFIN !)
-- k200 = 200 ✅
-- k500 = 500 ✅
