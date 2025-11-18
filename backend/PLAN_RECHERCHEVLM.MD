# 🎯 Consignes Claude Code : Ajout recherche VLM à l'interface

## 📋 Contexte

**Projet :** Visual Shazam - Recherche de pochettes d'albums  
**État actuel :** Interface existante avec recherche CLIP (visuelle)  
**Objectif :** Ajouter un mode de recherche VLM (sémantique via descriptions textuelles)

**Base de données :**
- 25,790 albums total
- 490 albums avec VLM (descriptions + embeddings 768D)
- Tous les albums ont CLIP (embeddings visuels 512D)

---

## 🎯 Fonctionnalité à implémenter

Ajouter un **système de recherche multi-mode** permettant à l'utilisateur de choisir entre :
1. **CLIP** (recherche visuelle - existant)
2. **VLM** (recherche sémantique - nouveau)
3. **Hybrid** (combinaison - placeholder pour futur)

---

## 📐 Architecture proposée

### Frontend (Interface utilisateur)

#### 1. Ajout d'un sélecteur de mode

**Localisation :** Dans le composant de recherche principal (probablement `SearchInterface.tsx` ou similaire)

**Élément UI :** 
- Radio buttons ou Tabs pour sélectionner le mode
- Options : `CLIP` | `VLM` | `Hybrid`
- Mode par défaut : `CLIP` (pour ne pas casser l'existant)

**Exemple de structure :**
```
┌─────────────────────────────────────────────┐
│  🔍 Search Albums                           │
│  ┌───────────────────────────────────────┐  │
│  │ [Enter search query...]               │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Search Mode:                               │
│  (•) CLIP     ( ) VLM     ( ) Hybrid       │
│   Visual    Semantic    Combined            │
└─────────────────────────────────────────────┘
```

#### 2. Logique de recherche

**Comportement selon le mode sélectionné :**

- **Mode CLIP** → Appel à l'endpoint existant (probablement `/api/search` ou `/api/search-clip`)
- **Mode VLM** → Appel au nouvel endpoint `/api/search-vlm`
- **Mode Hybrid** → Afficher "Coming soon" pour l'instant (ou appeler `/api/search-hybrid` si implémenté)

**Note :** Le mode VLM doit vérifier côté backend qu'il y a des albums avec `vlm_processed = TRUE`.

#### 3. Affichage des résultats

**Pour CLIP (existant) :**
- Image de la pochette
- Artist - Album Name
- Genre • Year • Score
- Similarity score

**Pour VLM (nouveau) :**
- Tout ce qui est en CLIP +
- **Description VLM** affichée sous l'image
- Badge "VLM" pour différencier

**Exemple de carte de résultat VLM :**
```
┌─────────────────────────────────────────────┐
│ [Image pochette]    🏷️ VLM                  │
│                                             │
│ Artist Name - Album Name                    │
│ Genre • 2010 • ⭐ 8.5                       │
│ Similarity: 0.87                            │
│                                             │
│ 📝 Description:                             │
│ "The album cover features a minimalist     │
│ design with bold yellow typography on a    │
│ white background. A banana illustration    │
│ is prominently displayed..."               │
│ [Show full description]                     │
└─────────────────────────────────────────────┘
```

#### 4. Gestion des albums sans VLM

**Problème :** Seulement 490/25,790 albums ont des embeddings VLM pour l'instant.

**Solution :**
- Afficher un indicateur de progression : "VLM available for 490/25,790 albums (2%)"
- Si aucun résultat VLM trouvé : "No VLM results. Try CLIP mode or wait for more albums to be processed."
- Optionnellement : fallback automatique vers CLIP si 0 résultats VLM

#### 5. UI/UX améliorations

**Responsive :**
- Sur mobile : tronquer les descriptions à 150 chars avec "... Read more"
- Bouton pour expand/collapse la description complète

**Loading states :**
- Spinner pendant la recherche
- Message "Generating semantic embedding..." spécifique au mode VLM

**Empty states :**
- Si 0 résultats : suggestions de queries alternatives
- Messages d'erreur clairs si le backend est down

---

### Backend (API)

#### 1. Nouvel endpoint `/api/search-vlm`

**Méthode :** GET ou POST  
**Paramètres :**
- `query` (string, required) : Texte de recherche
- `limit` (number, optional, default: 10) : Nombre de résultats
- `min_similarity` (number, optional, default: 0.0) : Seuil minimum
- `filter_warnings` (boolean, optional, default: false) : Exclure albums avec warnings

**Workflow :**

1. **Recevoir la query utilisateur**
   ```
   Input: "minimalist album cover with bold typography"
   ```

2. **Générer l'embedding textuel**
   - Utiliser le modèle `BAAI/bge-base-en-v1.5`
   - Output : vecteur 768D
   ```
   Embedding: [0.234, -0.567, 0.123, ...]
   ```

3. **Query Supabase**
   ```sql
   SELECT 
     id, 
     artist, 
     album_name, 
     genre,
     release_year,
     pitchfork_score,
     cover_url, 
     vlm_description,
     1 - (vlm_embedding <=> $1::vector) as similarity
   FROM album_covers
   WHERE vlm_processed = TRUE
     AND ($2 OR vlm_warning IS NULL)  -- filter_warnings
   ORDER BY vlm_embedding <=> $1::vector
   LIMIT $3;
   ```
   
   Paramètres :
   - `$1` : embedding de la query (768D)
   - `$2` : NOT filter_warnings (inverse du paramètre)
   - `$3` : limit

4. **Retourner les résultats**
   ```json
   {
     "mode": "vlm",
     "query": "minimalist album cover",
     "results": [
       {
         "id": "123",
         "artist": "The Velvet Underground",
         "album_name": "The Velvet Underground & Nico",
         "genre": "Rock",
         "release_year": 1967,
         "pitchfork_score": 10.0,
         "cover_url": "https://...",
         "vlm_description": "The album cover features a minimalist design...",
         "similarity": 0.87
       },
       ...
     ],
     "total_found": 10,
     "processing_time_ms": 234
   }
   ```

#### 2. Charger le modèle d'embedding

**Important :** Le modèle `BAAI/bge-base-en-v1.5` doit être chargé **une seule fois** au démarrage du serveur (pas à chaque requête).

**Pseudo-code :**
```
# Au démarrage du serveur
text_model = load_model("BAAI/bge-base-en-v1.5")

# À chaque requête /api/search-vlm
def search_vlm(query):
    embedding = text_model.encode(query)  # Rapide (~50ms)
    results = query_supabase(embedding)
    return results
```

**Librairies nécessaires :**
- Python : `sentence-transformers`
- Node.js : Utiliser un service Python séparé ou `@xenova/transformers` (moins optimal)

#### 3. Endpoint `/api/search-hybrid` (optionnel, pour futur)

**Workflow :**
1. Générer embedding CLIP (512D) ET embedding VLM (768D)
2. Faire 2 requêtes parallèles à Supabase
3. Fusionner les résultats avec pondération :
   ```
   final_score = (w_clip × score_clip) + (w_vlm × score_vlm)
   ```
   Exemples de poids :
   - Balanced : 0.5 / 0.5
   - Visual-heavy : 0.7 / 0.3
   - Semantic-heavy : 0.3 / 0.7

4. Trier par `final_score` et retourner top N

**Note :** Pour l'instant, retourner juste `{"status": "coming_soon"}`.

#### 4. Gestion des erreurs

**Erreurs possibles :**
- Modèle d'embedding pas chargé → 503 Service Unavailable
- Supabase down → 502 Bad Gateway
- Query vide → 400 Bad Request
- Aucun album VLM disponible → 200 OK avec results vides + message explicatif

**Format d'erreur :**
```json
{
  "error": true,
  "message": "No VLM embeddings available yet. Only 490/25790 albums processed.",
  "code": "VLM_NOT_READY",
  "fallback_suggestion": "Try CLIP mode instead"
}
```

---

## 🗂️ Modifications de fichiers

### Frontend

**Fichiers probables à modifier :**
- `src/components/SearchInterface.tsx` (ou équivalent)
- `src/components/ResultCard.tsx` (affichage résultats)
- `src/types/search.ts` (types TypeScript)
- `src/api/search.ts` (appels API)
- `src/hooks/useSearch.ts` (logique de recherche)

**Nouveaux types TypeScript suggérés :**
```typescript
type SearchMode = 'clip' | 'vlm' | 'hybrid';

interface SearchParams {
  query: string;
  mode: SearchMode;
  limit?: number;
  minSimilarity?: number;
  filterWarnings?: boolean;
}

interface VLMResult extends CLIPResult {
  vlm_description: string;
  vlm_warning?: string;
}
```

### Backend

**Fichiers probables à créer/modifier :**
- `api/search-vlm.ts` (ou `.py` selon stack)
- `services/embeddings.ts` (chargement modèle)
- `lib/supabase.ts` (queries)
- `types/api.ts` (types partagés)

**Structure suggérée :**
```
backend/
├── api/
│   ├── search-clip.ts      (existant)
│   ├── search-vlm.ts       (nouveau)
│   └── search-hybrid.ts    (futur)
├── services/
│   ├── clip-embeddings.ts  (existant)
│   ├── text-embeddings.ts  (nouveau)
│   └── model-loader.ts     (nouveau)
├── lib/
│   └── supabase.ts
```

---

## 🧪 Tests suggérés

### Queries de test

**Pour VLM (devrait exceller) :**
- "minimalist album cover with bold typography"
- "dark moody melancholic atmosphere"
- "vintage 80s aesthetic with warm colors"
- "surreal dreamlike imagery"
- "black and white photography"

**Pour CLIP (devrait exceller) :**
- "baby swimming underwater" (visuel spécifique)
- "red and blue color scheme"
- "person wearing sunglasses"
- Upload d'une image similaire

**Pour comparaison :**
- Tester la même query sur CLIP et VLM
- Comparer les résultats
- Noter les différences

### Cas limites

- Query vide
- Query très longue (>500 chars)
- Caractères spéciaux / emojis
- Requêtes en français (le modèle supporte multilingue)
- 0 résultats trouvés

---

## 📊 Monitoring / Analytics (optionnel)

**Métriques à tracker :**
- Nombre de recherches par mode (CLIP vs VLM)
- Temps de réponse moyen par mode
- Taux de "0 résultats"
- Queries les plus fréquentes par mode

**Où logger :**
- Console backend (pour debug)
- Service d'analytics (Google Analytics, Mixpanel, etc.)
- Base de données (table `search_logs`)

---

## 🎨 Design suggestions

### Badge de mode

Afficher un badge discret sur chaque résultat :
- 🔍 CLIP (bleu)
- 🧠 VLM (vert)
- 🔀 HYBRID (violet)

### Indicateur de disponibilité VLM

Afficher quelque part dans l'interface :
```
📊 VLM Coverage: 490/25,790 albums (2%)
⏳ More albums being processed...
```

### Toggle animations

- Transition smooth entre les modes
- Loading skeleton pendant la recherche
- Fade-in des résultats

---

## 🚀 Déploiement

### Ordre recommandé

1. **Backend first :**
   - Implémenter `/api/search-vlm`
   - Tester avec Postman/curl
   - Charger le modèle d'embedding

2. **Frontend ensuite :**
   - Ajouter le sélecteur de mode
   - Connecter à l'API VLM
   - Affichage des descriptions

3. **Testing :**
   - Tests unitaires backend
   - Tests E2E frontend
   - User testing

4. **Déploiement progressif :**
   - Feature flag pour activer/désactiver VLM
   - Monitoring des erreurs
   - Rollback plan si problème

---

## 🔧 Configuration

### Variables d'environnement à ajouter

```env
# Backend
VLM_MODEL_PATH=BAAI/bge-base-en-v1.5
VLM_ENABLED=true
VLM_MIN_SIMILARITY=0.0
VLM_DEFAULT_LIMIT=10

# Frontend
NEXT_PUBLIC_VLM_ENABLED=true
```

### Supabase

Assurer que les colonnes suivantes existent :
- `vlm_description` (TEXT)
- `vlm_embedding` (vector(768))
- `vlm_processed` (BOOLEAN)
- `vlm_warning` (TEXT)

Index nécessaire :
```sql
CREATE INDEX idx_vlm_embedding
ON album_covers
USING hnsw (vlm_embedding vector_cosine_ops);
```

---

## 📚 Ressources

**Modèle d'embedding :**
- Hugging Face : https://huggingface.co/BAAI/bge-base-en-v1.5
- Documentation : https://www.sbert.net/

**Librairies :**
- Python : `pip install sentence-transformers`
- Node.js : `npm install @xenova/transformers` (ou service Python séparé)

**Supabase vector search :**
- Doc : https://supabase.com/docs/guides/ai/vector-search
- Exemples : https://supabase.com/docs/guides/ai/examples

---

## ✅ Checklist implémentation

### Backend
- [ ] Créer endpoint `/api/search-vlm`
- [ ] Charger modèle `BAAI/bge-base-en-v1.5` au startup
- [ ] Implémenter génération d'embedding pour query
- [ ] Query Supabase avec vector search
- [ ] Gestion d'erreurs complète
- [ ] Tests unitaires
- [ ] Documentation API

### Frontend
- [ ] Ajouter sélecteur de mode (CLIP/VLM/Hybrid)
- [ ] State management pour mode sélectionné
- [ ] Appel à `/api/search-vlm`
- [ ] Affichage descriptions VLM
- [ ] Badge de mode sur résultats
- [ ] Indicateur de disponibilité VLM
- [ ] Gestion des états vides/erreurs
- [ ] Responsive design
- [ ] Tests E2E

### Nice-to-have
- [ ] Expand/collapse descriptions
- [ ] Highlight matching keywords dans descriptions
- [ ] Export résultats en CSV
- [ ] Partage de recherche (URL avec query)
- [ ] Historique de recherches
- [ ] Suggestions de queries

---

## 🎯 Priorités

**Phase 1 (MVP) :**
- Backend : Endpoint VLM basique
- Frontend : Sélecteur de mode + affichage descriptions

**Phase 2 (Améliorations) :**
- Gestion erreurs complète
- UI polish (animations, badges, etc.)
- Tests exhaustifs

**Phase 3 (Avancé) :**
- Mode Hybrid
- Analytics
- Features nice-to-have

---

## 💡 Notes importantes

1. **Performance :** Le modèle d'embedding doit être chargé UNE FOIS au startup, pas à chaque requête.

2. **Fallback :** Si VLM échoue, proposer automatiquement CLIP comme alternative.

3. **Cache :** Envisager de cacher les embeddings de queries fréquentes côté backend.

4. **Incremental rollout :** Commencer avec VLM en beta/experimental flag avant de le rendre public.

5. **User education :** Ajouter des tooltips expliquant la différence entre CLIP et VLM.

---

**Document créé le :** 2024-11-17  
**Version :** 1.0  
**Projet :** Visual Shazam - VLM Integration