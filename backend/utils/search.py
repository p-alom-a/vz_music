import faiss
import pickle
import torch
from transformers import CLIPModel, CLIPProcessor
from PIL import Image
import numpy as np
import time

class AlbumSearchEngine:
    def __init__(self, index_path: str, metadata_path: str):
        """Initialize CLIP model and FAISS index"""
        print("🚀 Loading CLIP model...")
        self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"📱 Using device: {self.device}")
        self.model = self.model.to(self.device)
        self.model.eval()  # Set to evaluation mode

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
        start_time = time.time()
        print(f"🔍 Starting text search for: '{query}'")

        # Process text
        t1 = time.time()
        inputs = self.processor(text=query, return_tensors="pt").to(self.device)
        print(f"⏱️ Text processing: {time.time() - t1:.2f}s")

        # Generate embedding
        t2 = time.time()
        with torch.no_grad():
            embedding = self.model.get_text_features(**inputs).cpu().numpy()
        print(f"⏱️ CLIP embedding: {time.time() - t2:.2f}s")

        # Search in FAISS
        t3 = time.time()
        faiss.normalize_L2(embedding)
        distances, indices = self.index.search(embedding, k)
        print(f"⏱️ FAISS search: {time.time() - t3:.2f}s")

        # Format results
        results = []
        for idx, score in zip(indices[0], distances[0]):
            results.append({
                "album_id": int(idx),
                "genre_id": int(self.metadata['labels'][idx]),
                "similarity_score": float(score)
            })

        print(f"✅ Search completed in {time.time() - start_time:.2f}s")
        return results
