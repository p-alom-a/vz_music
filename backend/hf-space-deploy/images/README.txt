IMAGES DIRECTORY
================

This directory should contain 25,790 album cover images for the Shazam Visual API.

IMAGE SPECIFICATIONS:
---------------------

Naming Convention: album_{id}.jpg
- album_0.jpg
- album_1.jpg
- album_2.jpg
- ...
- album_25789.jpg

Format: JPEG
Total Files: 25,790
Total Size: ~8 GB
Average File Size: ~300-350 KB per image

UPLOAD OPTIONS:
---------------

These images are NOT included in Git due to size (8 GB total).
Choose one of the following upload methods:

Option A: ZIP Upload (Recommended for HF Spaces)
1. Create a ZIP archive of all images locally
2. Upload ZIP to HF Space via web interface
3. Extract in Space terminal:
   ```bash
   cd images
   unzip images.zip
   rm images.zip
   ```

Option B: Git LFS (Not Recommended - Very Slow)
- Git LFS can handle large files but is VERY slow for 25k+ files
- Only use if you have good bandwidth and patience
- Setup:
  ```bash
  git lfs install
  git lfs track "images/*.jpg"
  git add .gitattributes images/
  git commit -m "Add images"
  git push origin main  # This will take hours!
  ```

Option C: Python Script Upload (Best for Automation)
- Use huggingface_hub API to upload programmatically
- Can upload from Google Drive, S3, or local storage
- Fastest for large batches
- Example:
  ```python
  from huggingface_hub import HfApi
  from pathlib import Path

  api = HfApi()
  images_dir = Path("local_images_folder")

  for img_path in images_dir.glob("album_*.jpg"):
      api.upload_file(
          path_or_fileobj=str(img_path),
          path_in_repo=f"images/{img_path.name}",
          repo_id="your-username/your-space-name",
          repo_type="space"
      )
  ```

Option D: Cloud Storage + Lazy Loading (Alternative)
- Store images in S3, GCS, or CDN
- Modify app.py to fetch images on-demand
- Reduces Space storage requirements
- Adds network latency to image requests

VERIFICATION:
-------------

After upload, verify:
1. Check images/ directory contains 25,790 .jpg files
2. Test a few image URLs: /api/image/0, /api/image/100, /api/image/25789
3. Check Space logs for "Image file not found" errors
4. Run stats endpoint: /api/stats should show correct count

TROUBLESHOOTING:
----------------

Issue: "Image file not found (404)"
- Ensure filename format is exactly: album_{id}.jpg (lowercase, no spaces)
- Check that album_id matches metadata entries
- Verify file permissions (should be readable)

Issue: "Upload timeout"
- Try uploading in smaller batches (e.g., 1000 images at a time)
- Use Python script instead of web interface for large uploads
- Consider using rsync or scp if you have server access

Issue: "Out of storage space"
- HF Spaces Free tier: 50 GB limit (8 GB images should fit)
- If exceeded, upgrade Space to higher tier
- Or use cloud storage + lazy loading approach

FILE STRUCTURE:
---------------

Expected directory structure:
images/
├── README.txt (this file)
├── album_0.jpg (REQUIRED)
├── album_1.jpg (REQUIRED)
├── album_2.jpg (REQUIRED)
├── ...
└── album_25789.jpg (REQUIRED)

Total: 25,790 JPG files

IMPORTANT NOTES:
----------------

- DO NOT commit images to Git without LFS (repo will become too large)
- Ensure consistent naming: album_{id}.jpg (not Album_{id}.JPG or album{id}.jpg)
- Images must match metadata entries (same local_id values)
- Test with a small subset first before uploading all 25k images
- Consider setting up a CDN for production use to reduce Space storage costs

For questions or issues, check the main README.md or open an issue on GitHub.
