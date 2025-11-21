"""
Configuration and constants for the Shazam Visual API.
"""
import os
from typing import Optional
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

# API Constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_K = 500
DEFAULT_K = 50

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Model Configuration
CLIP_MODEL_NAME = "openai/clip-vit-base-patch32"


def init_supabase() -> Client:
    """
    Initialize and return a Supabase client.

    Returns:
        Client: Initialized Supabase client

    Raises:
        ValueError: If SUPABASE_URL or SUPABASE_KEY are not set
    """
    logger.info("Initializing Supabase client...")

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")

    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully")
    return client
