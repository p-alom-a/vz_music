"""
CLIP service for generating embeddings from images and text.
"""
import torch
import numpy as np
from transformers import CLIPModel, CLIPProcessor
from PIL import Image
import logging
from typing import Tuple

logger = logging.getLogger(__name__)


class CLIPService:
    """Service for CLIP model inference and embedding generation."""

    def __init__(self, model_name: str = "openai/clip-vit-base-patch32"):
        """
        Initialize CLIP service with model and processor.

        Args:
            model_name: HuggingFace model identifier
        """
        logger.info(f"Loading CLIP model ({model_name})...")
        self.model = CLIPModel.from_pretrained(model_name)
        self.processor = CLIPProcessor.from_pretrained(model_name)
        self.device = torch.device("cpu")  # HF Spaces uses CPU
        self.model = self.model.to(self.device)
        self.model.eval()
        logger.info(f"CLIP model loaded successfully on {self.device}")

    def generate_image_embedding(self, image: Image.Image) -> np.ndarray:
        """
        Generate normalized embedding for an image.

        Args:
            image: PIL Image in RGB format

        Returns:
            Normalized embedding array (512-dimensional)
        """
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            embedding = self.model.get_image_features(**inputs).cpu().numpy()

        # L2 normalization for cosine similarity
        embedding = embedding / np.linalg.norm(embedding)
        return embedding[0]

    def generate_text_embedding(self, text: str) -> np.ndarray:
        """
        Generate normalized embedding for a text query.

        Args:
            text: Text query string

        Returns:
            Normalized embedding array (512-dimensional)
        """
        inputs = self.processor(text=text, return_tensors="pt").to(self.device)
        with torch.no_grad():
            embedding = self.model.get_text_features(**inputs).cpu().numpy()

        # L2 normalization for cosine similarity
        embedding = embedding / np.linalg.norm(embedding)
        return embedding[0]
