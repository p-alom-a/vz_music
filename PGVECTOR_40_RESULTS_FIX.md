# Fix: pgvector HNSW Index Limited to 40 Results

## 🐛 Problem

When using pgvector with HNSW indexes in Supabase, search queries were limited to exactly **40 results**, regardless of the `LIMIT` value in the SQL query or the `k` parameter passed to the RPC function.

### Symptoms
- Requesting 133 results → Returns 40
- Requesting 200 results → Returns 40
- Requesting 500 results → Returns 40

## 🔍 Root Cause

The HNSW (Hierarchical Navigable Small World) index in pgvector has a parameter called `hnsw.ef_search` that controls how many candidates the index examines during search.

**Default value: `hnsw.ef_search = 40`**

This parameter acts as a hard limit - you cannot retrieve more results than the `ef_search` value, even if your `LIMIT` clause requests more.

From pgvector documentation:
> "LIMIT <= hnsw.ef_search, so you have to raise hnsw.ef_search to a larger value"

## ✅ Solution

Use a **SECURITY DEFINER** wrapper function to set `hnsw.ef_search = 1000` before executing the vector search.

### Why This Approach?

In managed PostgreSQL environments like Supabase:
1. You cannot set `hnsw.ef_search` at the database/user level (permission denied)
2. You cannot use `SET hnsw.ef_search` in function definitions (permission denied)
3. You cannot use `SET LOCAL` in STABLE functions (not allowed in non-volatile functions)

**Solution:** Use `SECURITY DEFINER` + `set_config()` function to bypass restrictions.

### Implementation

See `/Users/palomasanchezc/Documents/viz_search/SOLUTION_SECURITY_DEFINER.sql`

The solution consists of 3 functions:

1. **`search_albums_wrapper`**: SECURITY DEFINER function that sets ef_search
2. **`search_albums_inner`**: The actual vector search implementation
3. **`search_albums`**: Alias for backward compatibility with existing code

### Key Code

```sql
CREATE OR REPLACE FUNCTION public.search_albums_wrapper(...)
RETURNS TABLE (...)
LANGUAGE plpgsql
SECURITY DEFINER  -- ⭐ Runs with postgres privileges
AS $$
BEGIN
  -- Set ef_search to maximum (1000)
  PERFORM set_config('hnsw.ef_search', '1000', true);

  -- Call the actual search function
  RETURN QUERY
  SELECT * FROM public.search_albums_inner(...);
END;
$$;
```

## 📊 Results

After applying the fix:

| Requested (k) | Before | After |
|---------------|--------|-------|
| 40            | 40 ✅  | 40 ✅  |
| 133           | 40 ❌  | 133 ✅ |
| 200           | 40 ❌  | 200 ✅ |
| 500           | 40 ❌  | 500 ✅ |

## 🔗 References

- [pgvector GitHub Issue #684](https://github.com/pgvector/pgvector/issues/684)
- [Supabase HNSW Indexes Documentation](https://supabase.com/docs/guides/ai/vector-indexes/hnsw-indexes)
- [Crunchy Data: HNSW Indexes with pgvector](https://www.crunchydata.com/blog/hnsw-indexes-with-postgres-and-pgvector)

## 🎯 Performance Notes

- **`hnsw.ef_search`** controls the search quality vs speed tradeoff
- Higher values = better accuracy but slower queries
- Maximum value: 1000
- Default value: 40
- For production, you might want to make this configurable based on the use case

## 🚀 Deployment

1. Execute `SOLUTION_SECURITY_DEFINER.sql` in Supabase SQL Editor
2. Verify with the test queries at the end of the script
3. Your existing application code continues to work (backward compatible)

## 💡 Alternative Approaches (That Don't Work in Supabase)

❌ `SET hnsw.ef_search` in function definition → Permission denied
❌ `ALTER DATABASE SET hnsw.ef_search` → Permission denied
❌ `SET LOCAL` in function body → Not allowed in STABLE functions
✅ `SECURITY DEFINER` + `set_config()` → **Works!**
