---
title: Shazam Visual
emoji: 🎵
colorFrom: purple
colorTo: pink
sdk: docker
pinned: false
---

# 🎵 Visual Album Cover Search Engine

Visual search engine for album covers using **CLIP** embeddings. Find similar albums by uploading an image or describing what you're looking for!

## 🚀 Features

- **Search by Image**: Upload an album cover to find visually similar albums
- **Search by Text**: Describe what you're looking for (e.g., "dark metal album", "red cover")
- **Genre Filtering**: Filter search results by music genre
- **Fast Search**: 15,000+ albums indexed for instant similarity search
- **Powered by CLIP**: OpenAI's CLIP model for multimodal understanding

## 🔧 API Endpoints

### Health Check
```bash
GET /health
```

### Search by Text
```bash
GET /api/search-by-text?query=dark+album&k=5
GET /api/search-by-text?query=guitar&genre=Rock&k=10
```

### Search by Image
```bash
POST /api/search-by-image?k=5
POST /api/search-by-image?k=5&genre=Electronic
Content-Type: multipart/form-data
Body: file=<image file>
```

### Get Genres
```bash
GET /api/genres
```

### Get Statistics
```bash
GET /api/stats
```

## 📊 Response Format

```json
{
  "success": true,
  "query_type": "text",
  "results": [
    {
      "id": "12345",
      "artist": "Artist Name",
      "album_name": "Album Title",
      "genre": "Rock",
      "release_year": 2020,
      "pitchfork_score": 8.5,
      "best_new_music": true,
      "cover_url": "https://...",
      "similarity": 0.95
    }
  ]
}
```

## 💻 Tech Stack

- **Backend**: FastAPI + Python 3.11
- **ML Models**: CLIP (openai/clip-vit-base-patch32)
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Database**: PostgreSQL with pgvector extension

## 🌐 Live Demo

- **Backend API**: This HuggingFace Space
- **Frontend**: https://vz-music.vercel.app

## 📚 Documentation

- Full documentation: See `DEPLOY.md` in the repository
- GitHub: https://github.com/p-alom-a/vz_music

## 🎯 Use Cases

- Find albums with similar artwork
- Discover music based on visual style
- Explore album cover design trends
- Build music recommendation systems

## 📝 License

MIT License - See repository for details

---

Built with ❤️ using CLIP embeddings and vector similarity search
