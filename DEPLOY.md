# 🚀 Guide de déploiement Railway

## Prérequis

- Compte GitHub
- Compte Railway (gratuit: https://railway.app)
- Git installé localement

## Étape 1: Préparer le repository GitHub

### 1.1 Initialiser Git
```bash
cd /Users/palomasanchezc/Documents/viz_search
git init
git add .
git commit -m "Initial commit - Shazam Visual"
```

### 1.2 Créer un repo GitHub
1. Aller sur https://github.com/new
2. Créer un nouveau repository (ex: `shazam-visual`)
3. Ne pas initialiser avec README (on a déjà du code)

### 1.3 Pusher le code
```bash
git remote add origin https://github.com/VOTRE_USERNAME/shazam-visual.git
git branch -M main
git push -u origin main
```

## Étape 2: Déployer le Backend sur Railway

### 2.1 Créer le projet Railway
1. Aller sur https://railway.app
2. Cliquer sur "New Project"
3. Choisir "Deploy from GitHub repo"
4. Sélectionner votre repo `shazam-visual`

### 2.2 Configurer le service backend
1. Railway va créer un service automatiquement
2. Cliquer sur le service → Settings
3. Dans "Root Directory", entrer: `backend`
4. Dans "Start Command", laisser vide (Railway utilise le Procfile)
5. Railway détectera automatiquement Python et installera les dépendances

### 2.3 Attendre le déploiement
- Le premier build prend 3-5 minutes (téléchargement de PyTorch + CLIP)
- Vérifier les logs pour voir "Application startup complete"

### 2.4 Obtenir l'URL du backend
1. Dans le service backend → Settings → Networking
2. Cliquer sur "Generate Domain"
3. Copier l'URL (ex: `https://backend-production-xxxx.up.railway.app`)

### 2.5 Tester le backend
```bash
curl https://VOTRE_URL_BACKEND/health
# Devrait retourner: {"status":"healthy","total_albums":20000}
```

## Étape 3: Déployer le Frontend sur Railway

### 3.1 Ajouter un service frontend
1. Dans le même projet Railway, cliquer sur "+ New"
2. Choisir "GitHub Repo" → Sélectionner le même repo
3. Cliquer sur le nouveau service → Settings
4. Dans "Root Directory", entrer: `frontend`

### 3.2 Configurer la variable d'environnement
1. Dans le service frontend → Variables
2. Ajouter une nouvelle variable:
   - **Nom**: `NEXT_PUBLIC_API_URL`
   - **Valeur**: L'URL de votre backend (ex: `https://backend-production-xxxx.up.railway.app`)

### 3.3 Attendre le déploiement
- Le build prend 2-3 minutes
- Railway détecte automatiquement Next.js

### 3.4 Obtenir l'URL du frontend
1. Dans le service frontend → Settings → Networking
2. Cliquer sur "Generate Domain"
3. Copier l'URL (ex: `https://frontend-production-xxxx.up.railway.app`)

## Étape 4: Tester l'application déployée

1. Ouvrir l'URL du frontend dans le navigateur
2. Essayer une recherche par texte (ex: "dark album")
3. La première requête prendra 1-2 secondes (CLIP génère l'embedding)
4. Les requêtes suivantes seront plus rapides

## 📊 Ressources Railway

**Plan gratuit:**
- $5 de crédit/mois
- 500h d'exécution (~16h/jour)
- Largement suffisant pour un MVP

**Estimation de coût:**
- Backend (1GB RAM): ~$4-5/mois
- Frontend (512MB RAM): ~$2-3/mois
- Total: ~$6-8/mois

## 🐛 Troubleshooting

### Backend ne démarre pas
```bash
# Vérifier les logs Railway
# Aller dans le service → Deployments → Cliquer sur le dernier → View logs
```

**Erreurs communes:**
- "Out of memory": Augmenter la RAM à 1GB (Settings → Resources)
- "Module not found": Vérifier que `requirements.txt` est correct
- "Port binding error": Railway gère automatiquement le port via `$PORT`

### Frontend ne peut pas contacter le backend
1. Vérifier que `NEXT_PUBLIC_API_URL` est bien configurée
2. Vérifier que l'URL du backend est accessible
3. Vérifier les CORS dans `backend/main.py`

### CLIP est trop lent
- C'est normal! CLIP prend 1-2 secondes par requête sur CPU
- Pour accélérer: upgrade vers un plan avec GPU (plus cher)
- Alternative: utiliser une API CLIP externe

## 🔄 Mise à jour du code

```bash
# Faire des modifications localement
git add .
git commit -m "Update: description"
git push origin main

# Railway redéploiera automatiquement!
```

## 📝 Notes importantes

1. **Ne jamais committer de secrets** (.env, API keys) dans git
2. **CORS est configuré** pour accepter tous les domaines `*.railway.app`
3. **Les fichiers models** (40MB) sont inclus dans le repo
4. **Le premier démarrage** charge CLIP (~600MB), ça prend du temps

## 🎉 C'est tout!

Votre application est maintenant déployée et accessible publiquement sur Railway!

**URLs à garder:**
- Backend: `https://backend-production-xxxx.up.railway.app`
- Frontend: `https://frontend-production-xxxx.up.railway.app`
- Dashboard Railway: https://railway.app/dashboard
