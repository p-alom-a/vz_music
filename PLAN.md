# 🔄 Migration Backend : FAISS → Supabase

## 📋 Contexte

Le backend actuel utilise **FAISS** pour le stockage et la recherche vectorielle. On migre vers **Supabase (PostgreSQL + pgvector)** pour avoir une vraie base de données avec métadonnées structurées.

---

## 🎯 Changements à Faire

### **1. Dépendances (`requirements.txt`)**

**Ajouter :**
```txt
supabase
```

**Retirer (optionnel) :**
```txt
faiss-cpu  # Plus nécessaire
```

---

### **2. Variables d'Environnement**

**Ajouter dans les secrets HuggingFace Space :**
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...  # service_role key
```

---

### **3. Structure de Données Supabase**

**Table existante : `album_covers`**

```sql
CREATE TABLE album_covers (
  id text PRIMARY KEY,
  embedding vector(512),
  artist text,
  album_name text,
  genre text,
  release_year integer,
  pitchfork_score numeric,
  best_new_music boolean,
  cover_url text,
  reviewer text,
  metadata jsonb
);

-- Index HNSW pour recherche rapide
CREATE INDEX album_covers_embedding_idx 
ON album_covers 
USING hnsw (embedding vector_cosine_ops);
```

**Fonction RPC existante : `search_albums`**

```sql
CREATE FUNCTION search_albums(
  query_embedding vector(512),
  match_threshold float DEFAULT 0.0,
  match_count int DEFAULT 10,
  filter_genre text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  artist text,
  album_name text,
  genre text,
  release_year integer,
  pitchfork_score numeric,
  cover_url text,
  similarity float
)
```

---

### **4. Code Backend (`app.py`)**

#### **A. Initialisation**

**Remplacer :**
```python
# Ancien code FAISS
import faiss
index = faiss.read_index("album_index.faiss")
metadata = load_metadata()
```

**Par :**
```python
# Nouveau code Supabase
from supabase import create_client
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
```

---

#### **B. Recherche par Texte**

**Remplacer :**
```python
@app.get("/api/search-by-text")
def search_by_text(query: str, k: int = 10):
    embedding = generate_text_embedding(query)
    
    # Ancien : recherche FAISS
    distances, indices = index.search(embedding, k)
    results = [metadata[i] for i in indices[0]]
    
    return {"results": results}
```

**Par :**
```python
@app.get("/api/search-by-text")
def search_by_text(query: str, k: int = 10, genre: str = None):
    embedding = generate_text_embedding(query)
    
    # Nouveau : recherche Supabase
    params = {
        'query_embedding': embedding,
        'match_count': k
    }
    if genre:
        params['filter_genre'] = genre
    
    result = supabase.rpc('search_albums', params).execute()
    
    return {
        "success": True,
        "query_type": "text",
        "results": result.data
    }
```

---

#### **C. Recherche par Image**

**Même logique :**
- Remplacer `index.search()` par `supabase.rpc('search_albums')`
- Ajouter support du filtre `genre` optionnel

---

#### **D. Endpoint Genres (Nouveau)**

**Ajouter :**
```python
@app.get("/api/genres")
def get_genres():
    """Liste des genres disponibles"""
    result = supabase.table('album_covers')\
        .select('genre')\
        .execute()
    
    genres = list(set([row['genre'] for row in result.data if row['genre']]))
    genres.sort()
    
    return {
        "success": True,
        "genres": genres
    }
```

---

### **5. Format de Réponse**

**Ancien format FAISS :**
```json
{
  "results": [
    {
      "album_id": 12345,
      "genre_id": 8,
      "similarity_score": 0.95
    }
  ]
}
```

**Nouveau format Supabase :**
```json
{
  "success": true,
  "query_type": "text",
  "results": [
    {
      "id": "585",
      "artist": "Pink Floyd",
      "album_name": "The Dark Side of the Moon",
      "genre": "Rock",
      "release_year": 1973,
      "pitchfork_score": 10.0,
      "cover_url": "https://...",
      "similarity": 0.89
    }
  ]
}
```

---

## 🎨 Avantages de la Migration

### **Avant (FAISS) :**
- ❌ Métadonnées séparées dans un fichier JSON
- ❌ Pas de filtres (genre, année, etc.)
- ❌ Pas de base de données relationnelle
- ❌ Difficile à mettre à jour

### **Après (Supabase) :**
- ✅ Métadonnées structurées en SQL
- ✅ Filtres puissants (genre, année, score)
- ✅ Vraie base de données PostgreSQL
- ✅ Facile à query et mettre à jour
- ✅ API REST Supabase disponible
- ✅ Scalable (millions de vecteurs)

---

## 🚀 Checklist de Déploiement

### **Backend (HuggingFace Space) :**
- [ ] Ajouter `supabase` dans `requirements.txt`
- [ ] Ajouter secrets `SUPABASE_URL` et `SUPABASE_KEY`
- [ ] Remplacer code FAISS par code Supabase dans `app.py`
- [ ] Ajouter endpoint `/api/genres`
- [ ] Tester les 3 endpoints : `/health`, `/api/search-by-text`, `/api/search-by-image`

### **Frontend (Next.js) :**
- [ ] Mettre à jour le format de réponse attendu
- [ ] Ajouter dropdown filtre genre
- [ ] Afficher métadonnées complètes (artist, album_name, score, year)
- [ ] Gérer le nouveau champ `similarity` au lieu de `similarity_score`

---

## 📝 Notes Importantes

### **CLIP reste identique**
- ✅ Même modèle : `openai/clip-vit-base-patch32`
- ✅ Même dimension : 512
- ✅ Même normalisation : L2 norm

### **Ce qui change**
- ❌ Plus de FAISS
- ✅ Supabase RPC function
- ✅ Métadonnées enrichies
- ✅ Filtres par genre

### **Performance**
- FAISS : ~10ms pour 20k vecteurs
- Supabase (HNSW) : ~30-50ms pour 15k vecteurs
- ✅ Largement suffisant pour une web app

---

## 🔗 Ressources

- **Supabase Docs** : https://supabase.com/docs/guides/ai/vector-columns
- **Backend actuel** : https://huggingface.co/spaces/[ton-space]
- **Base de données** : 15,000 albums déjà indexés dans Supabase

---

## 💡 Instructions pour Claude Code

**Prompt suggéré :**

> "Migre mon backend FastAPI de FAISS vers Supabase.
> 
> **Contexte :**
> - Backend sur HuggingFace Space
> - Utilise CLIP pour générer embeddings
> - Actuellement FAISS pour la recherche vectorielle
> 
> **Changements :**
> - Remplacer FAISS par Supabase (PostgreSQL + pgvector)
> - Utiliser la fonction RPC `search_albums(query_embedding, match_count, filter_genre)`
> - Ajouter support filtre genre optionnel
> - Ajouter endpoint `/api/genres`
> - Mettre à jour format de réponse
> 
> **Credentials Supabase :**
> - URL : [à fournir via secrets]
> - Key : [à fournir via secrets]
> 
> **Structure Supabase :**
> - Table : `album_covers`
> - Colonnes : id, embedding(512), artist, album_name, genre, release_year, pitchfork_score, cover_url
> - Fonction RPC : `search_albums` (déjà créée)
> 
> Conserve la même logique CLIP, change uniquement la partie recherche vectorielle."

---

## ✅ Résultat Attendu

**API qui fonctionne avec :**
```bash
# Test recherche texte
curl "https://your-space.hf.space/api/search-by-text?query=dark+album&k=5"

# Test recherche texte + filtre
curl "https://your-space.hf.space/api/search-by-text?query=guitar&genre=Rock&k=10"

# Test liste genres
curl "https://your-space.hf.space/api/genres"

# Test recherche image
curl -X POST -F "file=@cover.jpg" "https://your-space.hf.space/api/search-by-image?k=5"
```

**Réponse attendue :**
```json
{
  "success": true,
  "results": [
    {
      "id": "585",
      "artist": "Pink Floyd",
      "album_name": "The Dark Side of the Moon",
      "genre": "Rock",
      "similarity": 0.89
    }
  ]
}
```