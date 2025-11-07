---
title: Shazam Visual
emoji: 🎵
colorFrom: purple
colorTo: pink
sdk: docker
pinned: false
---

# 🎵 Shazam Visual - Album Cover Search

Visual search engine for album covers using **CLIP** embeddings and **FAISS**. Find similar albums by uploading an image or describing what you're looking for!

## 🚀 Features

- **Search by Image**: Upload an album cover to find visually similar albums
- **Search by Text**: Describe what you're looking for (e.g., "dark metal album", "red cover")
- **Fast Search**: 20,000 albums indexed with FAISS for instant similarity search
- **Powered by CLIP**: OpenAI's CLIP model for multimodal understanding

## 🔧 API Endpoints

### Health Check
```bash
GET /health
```

### Search by Text
```bash
GET /api/search-by-text?query=dark+album&k=5
```

### Search by Image
```bash
POST /api/search-by-image?k=5
Content-Type: multipart/form-data
Body: file=<image file>
```

## 📊 Response Format

```json
{
  "success": true,
  "query_type": "text",
  "results": [
    {
      "album_id": 12345,
      "genre_id": 8,
      "similarity_score": 0.95
    }
  ]
}
```

## 💻 Tech Stack

- **Backend**: FastAPI + Python 3.11
- **ML Models**: CLIP (ViT-B/32) + FAISS
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS

## 🌐 Live Demo

- **Backend API**: This HuggingFace Space
- **Frontend**: [Coming soon]

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

Built with ❤️ using CLIP and FAISS
