# 🎯 Plan Claude Code - Shazam Visual Backend

## Contexte
Application de recherche d'images (Shazam visuel pour pochettes d'albums).
- Dataset: 20k pochettes avec embeddings CLIP déjà générés
- Fichiers prêts: `album_covers.index` (FAISS) + `metadata.pkl`
- Stack: FastAPI + CLIP + FAISS

---

## 📁 Structure à créer

```
backend/
├── main.py                    # API FastAPI principale
├── requirements.txt           # Dépendances Python
├── models/
│   ├── album_covers.index    # Index FAISS (à placer manuellement)
│   └── metadata.pkl          # Métadonnées (à placer manuellement)
├── utils/
│   └── search.py             # Logique de recherche
└── README.md                 # Documentation
```

---

## 📦 Fichier 1: requirements.txt

```
fastapi==0.115.0
uvicorn==0.30.0
python-multipart==0.0.9
pillow==10.4.0
transformers==4.44.0
torch==2.4.0
faiss-cpu==1.8.0
```

---

## 🔧 Fichier 2: utils/search.py

```python
import faiss
import pickle
import torch
from transformers import CLIPModel, CLIPProcessor
from PIL import Image
import numpy as np

class AlbumSearchEngine:
    def __init__(self, index_path: str, metadata_path: str):
        """Initialize CLIP model and FAISS index"""
        print("🚀 Loading CLIP model...")
        self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = self.model.to(self.device)
        
        print("🔍 Loading FAISS index...")
        self.index = faiss.read_index(index_path)
        
        print("📊 Loading metadata...")
        with open(metadata_path, 'rb') as f:
            self.metadata = pickle.load(f)
        
        print(f"✅ Ready! {self.index.ntotal} albums indexed")
    
    def search_by_image(self, image: Image.Image, k: int = 5):
        """Search by image, return top k results"""
        # Generate embedding
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            embedding = self.model.get_image_features(**inputs).cpu().numpy()
        
        # Normalize and search
        faiss.normalize_L2(embedding)
        distances, indices = self.index.search(embedding, k)
        
        # Format results
        results = []
        for idx, score in zip(indices[0], distances[0]):
            results.append({
                "album_id": int(idx),
                "genre_id": int(self.metadata['labels'][idx]),
                "similarity_score": float(score)
            })
        
        return results
    
    def search_by_text(self, query: str, k: int = 5):
        """Search by text description, return top k results"""
        inputs = self.processor(text=query, return_tensors="pt").to(self.device)
        with torch.no_grad():
            embedding = self.model.get_text_features(**inputs).cpu().numpy()
        
        faiss.normalize_L2(embedding)
        distances, indices = self.index.search(embedding, k)
        
        results = []
        for idx, score in zip(indices[0], distances[0]):
            results.append({
                "album_id": int(idx),
                "genre_id": int(self.metadata['labels'][idx]),
                "similarity_score": float(score)
            })
        
        return results
```

---

## 🚀 Fichier 3: main.py

```python
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
from utils.search import AlbumSearchEngine

# Initialize FastAPI
app = FastAPI(
    title="Shazam Visual API",
    description="Visual search engine for album covers using CLIP + FAISS",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize search engine at startup
search_engine = None

@app.on_event("startup")
async def startup_event():
    global search_engine
    search_engine = AlbumSearchEngine(
        index_path="models/album_covers.index",
        metadata_path="models/metadata.pkl"
    )

# Routes
@app.get("/")
def root():
    return {
        "message": "🎵 Shazam Visual API",
        "status": "running",
        "endpoints": {
            "search_image": "/api/search-by-image",
            "search_text": "/api/search-by-text",
            "docs": "/docs"
        }
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "total_albums": search_engine.index.ntotal if search_engine else 0
    }

@app.post("/api/search-by-image")
async def search_by_image(file: UploadFile = File(...), k: int = 5):
    """Upload an image to find similar album covers"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    
    try:
        # Read and open image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Search
        results = search_engine.search_by_image(image, k=k)
        
        return {
            "success": True,
            "query_type": "image",
            "results": results
        }
    
    except Exception as e:
        raise HTTPException(500, f"Search failed: {str(e)}")

@app.get("/api/search-by-text")
async def search_by_text(query: str, k: int = 5):
    """Search by text description (e.g., 'a red album cover with a guitar')"""
    if not query or len(query.strip()) == 0:
        raise HTTPException(400, "Query cannot be empty")
    
    try:
        results = search_engine.search_by_text(query, k=k)
        
        return {
            "success": True,
            "query_type": "text",
            "query": query,
            "results": results
        }
    
    except Exception as e:
        raise HTTPException(500, f"Search failed: {str(e)}")

# Run with: uvicorn main:app --reload --port 8000
```

---

## 📝 Fichier 4: README.md

```markdown
# 🎵 Shazam Visual - Backend API

Visual search engine for album covers using CLIP embeddings and FAISS.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Place model files in `models/` folder:**
   - `album_covers.index` (FAISS index)
   - `metadata.pkl` (metadata)

3. **Run the server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

4. **Access API:**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs

## Endpoints

### POST /api/search-by-image
Upload an image to find similar album covers.

**Parameters:**
- `file`: Image file (JPEG, PNG)
- `k`: Number of results (default: 5)

### GET /api/search-by-text
Search by text description.

**Parameters:**
- `query`: Text description (e.g., "a red album with guitar")
- `k`: Number of results (default: 5)

## Example Usage

```bash
# Search by image
curl -X POST "http://localhost:8000/api/search-by-image?k=5" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@album_cover.jpg"

# Search by text
curl "http://localhost:8000/api/search-by-text?query=red%20album&k=5"
```
```

---

## 🎯 Instructions pour Claude Code

**Commande à exécuter:**
```bash
# Dans le terminal, depuis le dossier backend/
claude-code "Crée la structure backend FastAPI selon le plan. Génère: requirements.txt, utils/search.py, main.py, README.md. Crée aussi le dossier models/ vide."
```

**Après génération:**
1. Placer manuellement les fichiers dans `models/`:
   - `album_covers.index`
   - `metadata.pkl`

2. Installer les dépendances:
   ```bash
   pip install -r requirements.txt
   ```

3. Lancer l'API:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

4. Tester:
   - http://localhost:8000 (root)
   - http://localhost:8000/docs (Swagger UI)

---

## 🧪 Test rapide

```python
# Test avec Python
import requests

# Test image
with open("test_album.jpg", "rb") as f:
    response = requests.post(
        "http://localhost:8000/api/search-by-image?k=3",
        files={"file": f}
    )
    print(response.json())

# Test text
response = requests.get(
    "http://localhost:8000/api/search-by-text?query=dark%20album&k=3"
)
print(response.json())
```

---

## ⚡ Next Steps

Une fois l'API fonctionnelle:
1. ✅ Frontend Next.js (upload + affichage résultats)
2. ✅ Récupérer les vraies images depuis le dataset HF
3. ✅ Déploiement Full Railway (Backend + Frontend)

---

## 🚂 Déploiement Full Railway

### Architecture
```
Railway Project "Shazam Visual"
├── Service 1: Backend FastAPI (Python)
│   └── URL: https://shazam-backend.up.railway.app
└── Service 2: Frontend Next.js (Node.js)
    └── URL: https://shazam-visual.up.railway.app
```

### Étapes de déploiement

**1. Préparer le Backend pour Railway**

Ajouter `Procfile` dans `/backend` :
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Ajouter `railway.json` dans `/backend` (optionnel) :
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**2. Créer le projet Railway**

```bash
# Installer Railway CLI (optionnel, peut se faire via web)
npm i -g @railway/cli

# Login
railway login

# Créer un nouveau projet
railway init
```

**3. Déployer le Backend**

Via interface web Railway :
1. New Project → Deploy from GitHub repo
2. Sélectionner ton repo
3. Add service → Backend
4. Root directory: `/backend`
5. Railway détecte Python automatiquement
6. Ajouter variables d'environnement si besoin :
   - `PORT` (auto-détecté)
   - `PYTHONUNBUFFERED=1`
7. Deploy !

**Upload des fichiers lourds (FAISS index)** :
- Option A : Commit dans Git (si <100MB)
- Option B : Utiliser Railway Volumes (persistent storage)
- Option C : Télécharger depuis URL au startup

Exemple pour Option C (ajouter dans `main.py`) :
```python
import os
import requests

@app.on_event("startup")
async def download_models():
    """Download models if not present"""
    if not os.path.exists("models/album_covers.index"):
        print("📥 Downloading FAISS index...")
        # Upload ton fichier sur HF ou Google Drive et récupère URL
        url = "https://huggingface.co/YOUR_USERNAME/models/resolve/main/album_covers.index"
        response = requests.get(url, stream=True)
        os.makedirs("models", exist_ok=True)
        with open("models/album_covers.index", "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print("✅ Models downloaded")
```

**4. Déployer le Frontend**

Via interface web Railway :
1. Add service → Frontend
2. Root directory: `/frontend`
3. Railway détecte Next.js automatiquement
4. Variables d'environnement :
   - `NEXT_PUBLIC_API_URL=https://shazam-backend.up.railway.app`
5. Deploy !

**5. Configuration finale**

Backend `main.py` - Update CORS :
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://shazam-visual.up.railway.app",  # Ton frontend Railway
        "https://*.railway.app"  # Tous les previews Railway
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Coûts Railway

**Plan gratuit :**
- $5 de crédit/mois
- 500h d'exécution (~16h/jour)
- Suffisant pour MVP et tests

**Estimation de consommation :**
- Backend (512 MB RAM) : ~$3-4/mois
- Frontend (512 MB RAM) : ~$2-3/mois
- **Total : ~$5-7/mois**

Le $5 gratuit couvre presque tout pour débuter !

### Monitoring

Railway fournit :
- ✅ Logs en temps réel
- ✅ Métriques (CPU, RAM, Network)
- ✅ Alertes
- ✅ Rollback facile

### Tips Railway

1. **Optimiser les images** : Utiliser des images Docker légères si besoin
2. **Environment variables** : Ne jamais commit de secrets, utiliser les variables Railway
3. **Health checks** : Ajouter un endpoint `/health` (déjà dans le code)
4. **Scaling** : Peut upgrade facilement vers plus de RAM si besoin

### Troubleshooting commun

**Problème : "Out of memory"**
- Solution : Upgrade vers 1GB RAM sur Railway (quelques $ de plus)

**Problème : "Build timeout"**
- Solution : Optimiser requirements.txt, utiliser build cache

**Problème : "Cold start lent"**
- Solution : Railway garde les services actifs, pas de cold start comme serverless
