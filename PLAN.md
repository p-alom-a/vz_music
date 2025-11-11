# 🚀 Instructions Claude Code - Déploiement HF Space Backend

## 📋 Contexte

Application de recherche visuelle d'albums musicaux (Shazam Visual) utilisant :
- **25,790 pochettes d'albums** (dataset Pitchfork)
- **Embeddings CLIP** (modèle : openai/clip-vit-base-patch32)
- **Index FAISS** pour recherche de similarité
- **FastAPI** pour l'API backend

**Objectif :** Créer la structure complète pour déploiement sur Hugging Face Space.

---

## 📁 Structure à créer

```
hf-space-deploy/
├── app.py                    # API FastAPI principale
├── requirements.txt          # Dépendances Python
├── README.md                 # Documentation du Space
├── .gitignore               # Fichiers à ignorer
├── models/                   # Dossier pour fichiers ML
│   ├── .gitkeep             # Placeholder (vrais fichiers uploadés manuellement)
│   └── README.txt           # Instructions pour placer les fichiers
└── images/                   # Dossier pour pochettes
    ├── .gitkeep             # Placeholder
    └── README.txt           # Instructions pour upload
```

---

## 🔧 Fichier 1 : `app.py`

### Spécifications

**Imports requis :**
- FastAPI, uvicorn
- transformers (CLIPModel, CLIPProcessor)
- torch
- faiss
- PIL (Image)
- numpy
- json, os, io

**Configuration au démarrage :**
```
1. Charger CLIP (openai/clip-vit-base-patch32) sur CPU
2. Charger index FAISS depuis models/album_covers.index
3. Charger métadonnées depuis models/valid_metadata_final.json
4. Logs clairs pour chaque étape
```

**CORS Configuration :**
```
allow_origins = ["*"]  # Permissif pour l'instant
allow_methods = ["*"]
allow_headers = ["*"]
```

### Endpoints à implémenter

#### **GET `/`**
- Retourne informations sur l'API
- Liste des endpoints disponibles
- Stats : nombre d'albums indexés

#### **GET `/health`**
- Status de l'API
- Confirme que modèles sont chargés
- Temps de réponse

#### **POST `/api/search-by-image`**
**Paramètres :**
- `file`: UploadFile (image)
- `k`: int (optionnel, default=10, max=50) - nombre de résultats

**Processus :**
1. Valider que c'est une image
2. Ouvrir avec PIL et convertir en RGB
3. Générer embedding CLIP (image features)
4. Normaliser L2
5. Rechercher dans FAISS (top k)
6. Récupérer métadonnées pour chaque résultat
7. Construire URLs images : `/api/image/{album_id}`

**Retour JSON :**
```json
{
  "success": true,
  "query_type": "image",
  "total_results": 10,
  "results": [
    {
      "album_id": 4761,
      "artist": "Pink Floyd",
      "album_name": "Dark Side of the Moon",
      "genre": "Rock",
      "release_year": 1973,
      "similarity_score": 0.953,
      "pitchfork_score": 10.0,
      "best_new_music": false,
      "image_url": "/api/image/4761",
      "cover_url_original": "https://..."
    }
  ]
}
```

**Gestion d'erreurs :**
- 400 si pas une image
- 413 si fichier trop gros (>10MB)
- 500 si erreur processing

#### **GET `/api/search-by-text`**
**Paramètres :**
- `query`: str (required) - texte de recherche
- `k`: int (optionnel, default=10, max=50)

**Processus :**
1. Valider query non vide
2. Générer embedding CLIP (text features)
3. Normaliser L2
4. Rechercher dans FAISS
5. Récupérer et retourner métadonnées

**Retour JSON :** Même format que search-by-image

#### **GET `/api/image/{album_id}`**
**Paramètres :**
- `album_id`: int (path parameter)

**Processus :**
1. Valider que album_id existe dans métadonnées
2. Construire chemin : `images/album_{album_id}.jpg`
3. Vérifier que fichier existe
4. Retourner image avec headers appropriés

**Headers :**
```
Content-Type: image/jpeg
Cache-Control: public, max-age=86400
```

**Erreurs :**
- 404 si album_id invalide ou image manquante

#### **GET `/api/stats`**
Statistiques du dataset :
- Nombre total d'albums
- Distribution par genre (top 10)
- Années couvertes (min/max)
- Scores Pitchfork moyens

### Fonctions utilitaires

**`load_clip_model()`**
- Charge modèle et processor
- Met sur device approprié (CPU)
- Retourne model, processor, device

**`load_faiss_index(path)`**
- Charge index depuis fichier
- Vérifie intégrité
- Retourne index

**`load_metadata(path)`**
- Charge JSON
- Parse et valide structure
- Retourne liste de dictionnaires

**`get_album_by_local_id(local_id, metadata)`**
- Recherche dans métadonnées par local_id
- Retourne dict ou None

### Configuration serveur

```python
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=7860,  # Port standard HF Spaces
        log_level="info"
    )
```

---

## 📦 Fichier 2 : `requirements.txt`

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-multipart==0.0.9
transformers==4.44.0
torch==2.4.0
faiss-cpu==1.8.0
pillow==10.4.0
numpy==1.26.0
```

**Notes :**
- `uvicorn[standard]` inclut les optimisations performance
- `faiss-cpu` pour compatibilité HF Spaces gratuit
- Versions spécifiques pour reproductibilité

---

## 📖 Fichier 3 : `README.md`

### Contenu à inclure

**Section 1 : Header**
```markdown
# 🎵 Shazam Visual - Album Cover Search Engine

Visual similarity search for album covers using CLIP embeddings and FAISS indexing.

**Dataset:** 25,790 album covers from Pitchfork reviews (1999-2024)  
**Model:** OpenAI CLIP ViT-B/32  
**Index:** FAISS (Flat Inner Product)
```

**Section 2 : Features**
- Search by uploading an album cover image
- Search by text description
- Fast similarity search (<100ms)
- 25k+ albums indexed

**Section 3 : API Endpoints**

Documentation pour chaque endpoint avec :
- Method + Path
- Parameters
- Example request (curl)
- Example response

**Section 4 : Usage Examples**

```bash
# Search by image
curl -X POST "https://your-space.hf.space/api/search-by-image" \
  -F "file=@album_cover.jpg" \
  -F "k=5"

# Search by text
curl "https://your-space.hf.space/api/search-by-text?query=dark%20ambient&k=5"

# Get image
curl "https://your-space.hf.space/api/image/4761" --output album.jpg
```

**Section 5 : Technical Details**
- Architecture overview
- Model specifications
- Dataset information
- Performance metrics

**Section 6 : Setup Instructions**

Pour développement local :
1. Clone repo
2. Install dependencies
3. Download models and images
4. Run uvicorn

**Section 7 : Limitations**
- Text search works better for visual concepts (colors, objects) than narrative descriptions
- Image-to-image search is more accurate than text-to-image
- Dataset limited to Pitchfork-reviewed albums

**Section 8 : Future Improvements**
- Fine-tune CLIP on album covers
- Add rate limiting
- API authentication
- More metadata filters

---

## 🚫 Fichier 4 : `.gitignore`

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/

# Models et données (trop lourds pour Git)
models/*.index
models/*.pkl
models/*.npy
images/*.jpg
images/*.jpeg
images/*.png

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```

---

## 📝 Fichier 5 : `models/README.txt`

```
MODELS DIRECTORY
================

This directory should contain:

1. album_covers.index
   - FAISS index file (~400 MB)
   - Contains 25,790 CLIP embeddings (512D)
   
2. valid_metadata_final.json
   - Metadata for all albums
   - Includes artist, title, genre, year, scores
   
3. metadata.pkl (optional)
   - Technical metadata
   - Model info and dataset stats

UPLOAD INSTRUCTIONS:
- Download these files from Google Drive
- Upload to this directory via HF Space interface
- Or use Git LFS for large files

FILES ARE NOT INCLUDED IN GIT DUE TO SIZE.
```

---

## 📝 Fichier 6 : `images/README.txt`

```
IMAGES DIRECTORY
================

This directory should contain 25,790 album cover images.

Naming convention: album_{id}.jpg
Example: album_0.jpg, album_1.jpg, ..., album_25789.jpg

UPLOAD OPTIONS:

Option A: Web Interface
- Create a ZIP of all images
- Upload via HF Space Files tab
- Extract in Space terminal

Option B: Git LFS
- Configure Git LFS for *.jpg
- Add and push images
- WARNING: Very slow for 25k files

Option C: Python Script
- Use huggingface_hub API
- Upload programmatically from Google Drive
- Fastest for large batches

TOTAL SIZE: ~8 GB
FILES ARE NOT INCLUDED IN GIT DUE TO SIZE.
```

---

## ✅ Validation checklist

Après génération, vérifier que :

- [ ] `app.py` contient tous les endpoints spécifiés
- [ ] CORS est configuré correctement
- [ ] Gestion d'erreurs sur tous les endpoints
- [ ] Logs informatifs au démarrage
- [ ] `requirements.txt` contient toutes les dépendances nécessaires
- [ ] README.md est complet et clair
- [ ] `.gitignore` exclut les fichiers lourds
- [ ] Placeholders dans `models/` et `images/`
- [ ] Instructions claires pour upload manuel des fichiers

---

## 🚀 Prochaines étapes (après génération)

1. **Tester localement** (optionnel mais recommandé)
   - Créer env virtuel
   - Installer requirements
   - Placer fichiers test dans models/
   - Lancer `uvicorn app:app --reload`
   - Tester endpoints avec curl ou Postman

2. **Créer HF Space**
   - Aller sur huggingface.co/new-space
   - Nom : `shazam-visual` ou similaire
   - SDK : Gradio (ou Docker si préféré)
   - Visibility : Public (on mettra privé après)

3. **Upload fichiers code**
   - Via interface web : drag & drop tous les .py, .txt, .md
   - Ou via Git : clone, add, commit, push

4. **Upload fichiers lourds** (séparément)
   - Models (album_covers.index, metadata JSON)
   - Images (25,790 JPG)

5. **Tester le Space**
   - Vérifier que l'API démarre
   - Tester /health
   - Tester search endpoints
   - Vérifier que images sont servies

6. **Configuration finale**
   - Ajuster settings si nécessaire
   - Mettre en privé si souhaité
   - Documenter l'URL du Space

---

## 💡 Notes importantes

**Performance :**
- CLIP inference sur CPU : ~500ms par image
- FAISS search : <10ms pour 25k vecteurs
- Temps total par recherche : ~500-600ms

**Limites HF Spaces gratuit :**
- CPU only (pas de GPU nécessaire)
- 16 GB RAM (suffisant)
- 50 GB storage (on utilise ~9 GB)
- Pas de timeout sur requests

**Sécurité :**
- Pas d'authentification pour MVP
- Space sera mis en privé manuellement
- À améliorer en production (API keys, rate limiting)

**Évolutivité :**
- Architecture prête pour scale
- Peut migrer vers AWS plus tard
- Code portable et bien structuré

---

## 🎯 Objectif final

Un dossier `hf-space-deploy/` complet et prêt à déployer, contenant :
- ✅ Backend FastAPI fonctionnel
- ✅ Documentation claire
- ✅ Structure organisée
- ✅ Instructions d'upload des fichiers lourds
- ✅ Prêt pour tests locaux et déploiement HF

**Le code doit être production-ready mais simple, sans over-engineering.**