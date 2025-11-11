MODELS DIRECTORY
================

This directory should contain the following files for the Shazam Visual API to work:

REQUIRED FILES:
---------------

1. album_covers.index
   - FAISS index file (~50 MB)
   - Contains 25,790 CLIP embeddings (512-dimensional vectors)
   - Type: IndexFlatIP (Inner Product for cosine similarity)
   - Generated from openai/clip-vit-base-patch32 model

2. valid_metadata_final.json
   - Album metadata file (~10 MB)
   - Contains 25,790 album entries
   - Fields per album:
     * local_id: Unique identifier (0-25789)
     * filename: Image filename (album_{id}.jpg)
     * artist: Artist name
     * album_name: Album title
     * genre: Genre(s)
     * label: Record label
     * release_year: Year of release
     * score: Pitchfork review score (0-10)
     * best_new_music: Boolean (0 or 1)
     * reviewer_name: Pitchfork reviewer
     * cover_url: Original image URL

OPTIONAL FILES:
---------------

3. metadata.pkl (optional)
   - Technical metadata
   - Model configuration info
   - Dataset statistics

UPLOAD INSTRUCTIONS:
--------------------

These files are NOT included in Git due to their size.
You must upload them manually before deploying the Space.

Option A: HuggingFace Web Interface
- Go to your Space's "Files" tab
- Click "Upload file" or drag & drop
- Upload album_covers.index and valid_metadata_final.json
- Place them in the models/ directory

Option B: Git LFS (Large File Storage)
- Install Git LFS: git lfs install
- Track large files: git lfs track "models/*.index" "models/*.json"
- Add and commit: git add models/ && git commit -m "Add model files"
- Push: git push origin main
- Note: May be slow for large files

Option C: Python Script (Programmatic Upload)
- Use huggingface_hub library
- Upload from Google Drive, S3, or local storage
- Fastest for batch uploads

Example using huggingface_hub:
```python
from huggingface_hub import HfApi
api = HfApi()
api.upload_file(
    path_or_fileobj="local_path/album_covers.index",
    path_in_repo="models/album_covers.index",
    repo_id="your-username/your-space-name",
    repo_type="space"
)
```

VERIFICATION:
-------------

After uploading, verify files are in place:
1. Check the Space's file browser shows models/album_covers.index and models/valid_metadata_final.json
2. Check the Space logs for successful loading messages
3. Test the /health endpoint to confirm models are loaded

FILE LOCATIONS:
---------------

Expected file structure:
models/
├── README.txt (this file)
├── album_covers.index (REQUIRED - upload manually)
└── valid_metadata_final.json (REQUIRED - upload manually)

DO NOT commit large binary files directly to Git without LFS!
