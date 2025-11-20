-- ✅ SOLUTION FINALE PROPRE: hnsw.ef_search = 1000 dans la définition de la fonction
-- Merci à la communauté Supabase pour cette astuce !
-- Le SET dans la définition est appliqué AVANT le plan d'exécution

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.search_albums CASCADE;

-- Recréer avec SET hnsw.ef_search dans la définition (pas dans BEGIN...END)
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
LANGUAGE plpgsql
STABLE  -- Peut rester STABLE maintenant !
SET hnsw.ef_search = 1000  -- ⭐ LA CLAUSE MAGIQUE : default=40, on monte à 1000 (max)
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

-- Permissions
GRANT EXECUTE ON FUNCTION public.search_albums(vector(512), integer, text, integer, integer)
TO anon, authenticated, service_role, postgres;

-- Tests pour vérifier que ça marche ENFIN !
WITH test_embedding AS (SELECT embedding FROM album_covers LIMIT 1)
SELECT
  (SELECT COUNT(*) FROM search_albums((SELECT embedding FROM test_embedding), 40)) as k40,
  (SELECT COUNT(*) FROM search_albums((SELECT embedding FROM test_embedding), 133)) as k133,
  (SELECT COUNT(*) FROM search_albums((SELECT embedding FROM test_embedding), 200)) as k200,
  (SELECT COUNT(*) FROM search_albums((SELECT embedding FROM test_embedding), 500)) as k500;

-- Résultats attendus:
-- k40 = 40 ✅
-- k133 = 133 ✅ (ENFIN, au lieu de 40 !)
-- k200 = 200 ✅
-- k500 = 500 ✅
