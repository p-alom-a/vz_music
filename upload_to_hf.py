#!/usr/bin/env python3
"""
Upload models and app.py to HuggingFace Space
"""

from huggingface_hub import HfApi
import os

# Configuration
SPACE_ID = "pepouze5/vz_music"
REPO_TYPE = "space"

# Files to upload
files_to_upload = [
    {
        "local_path": "app.py",
        "path_in_repo": "app.py"
    },
    {
        "local_path": "models/album_covers.index",
        "path_in_repo": "models/album_covers.index"
    },
    {
        "local_path": "models/valid_metadata_final.json",
        "path_in_repo": "models/valid_metadata_final.json"
    }
]

def main():
    api = HfApi()

    print(f"🚀 Uploading files to HuggingFace Space: {SPACE_ID}")
    print()

    for file_info in files_to_upload:
        local_path = file_info["local_path"]
        path_in_repo = file_info["path_in_repo"]

        if not os.path.exists(local_path):
            print(f"❌ File not found: {local_path}")
            continue

        file_size = os.path.getsize(local_path) / (1024 * 1024)  # MB
        print(f"📤 Uploading {local_path} ({file_size:.1f} MB) -> {path_in_repo}")

        try:
            api.upload_file(
                path_or_fileobj=local_path,
                path_in_repo=path_in_repo,
                repo_id=SPACE_ID,
                repo_type=REPO_TYPE,
                commit_message=f"Update {path_in_repo}"
            )
            print(f"   ✅ Success!")
        except Exception as e:
            print(f"   ❌ Error: {e}")

        print()

    print("✨ Done! Check your Space at:")
    print(f"   https://huggingface.co/spaces/{SPACE_ID}")

if __name__ == "__main__":
    main()
