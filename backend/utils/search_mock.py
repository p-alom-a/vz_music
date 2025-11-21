import random
import time

class AlbumSearchEngine:
    """Mock search engine for testing without CLIP"""

    def __init__(self, index_path: str, metadata_path: str):
        """Initialize mock search engine"""
        print("🚀 Loading MOCK search engine (no CLIP, instant results)...")
        self.total_albums = 20000
        print(f"✅ Ready! {self.total_albums} albums indexed (MOCK)")

    def search_by_image(self, image, k: int = 5):
        """Mock image search"""
        print(f"🔍 MOCK: image search, returning {k} fake results")
        time.sleep(0.1)  # Simulate tiny delay

        results = []
        for i in range(k):
            results.append({
                "album_id": random.randint(0, self.total_albums - 1),
                "genre_id": random.randint(0, 9),
                "similarity_score": random.uniform(0.7, 0.99)
            })

        return results

    def search_by_text(self, query: str, k: int = 5):
        """Mock text search"""
        start_time = time.time()
        print(f"🔍 MOCK: text search for '{query}', returning {k} fake results")

        # Simulate processing
        time.sleep(0.1)

        results = []
        for i in range(k):
            results.append({
                "album_id": random.randint(0, self.total_albums - 1),
                "genre_id": random.randint(0, 9),
                "similarity_score": random.uniform(0.7, 0.99)
            })

        print(f"✅ MOCK: Search completed in {time.time() - start_time:.2f}s")
        return results

    @property
    def index(self):
        """Mock index property"""
        class MockIndex:
            ntotal = 20000
        return MockIndex()
