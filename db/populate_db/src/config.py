"""
Configuration settings for database population
Loads settings from root .env file with sensible defaults
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from root .env file if it exists
root_dir = Path(__file__).parent.parent.parent  # Go up to project root
load_dotenv(root_dir / ".env")

# Database Configuration - loaded from environment variables (matching root .env names)
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "supply_chain_db"),
    "user": os.getenv("DB_USER", "supply_chain_user"),
    "password": os.getenv("DB_PASSWORD", "supply_chain_password"),
}

# MinIO Configuration - loaded from environment variables (matching root .env names)
MINIO_CONFIG = {
    "endpoint": os.getenv("MINIO_ENDPOINT", "localhost:9000"),
    "access_key": os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
    "secret_key": os.getenv("MINIO_SECRET_KEY", "minioadmin"),
    "secure": os.getenv("MINIO_SECURE", "false").lower() == "true",
    "quotes_bucket": os.getenv("MINIO_QUOTES_BUCKET_NAME", "quotes"),
    "product_records_bucket": os.getenv(
        "MINIO_PRODUCT_RECORDS_BUCKET_NAME", "product-records"
    ),
}

# File paths for sample data
SCRIPT_DIR = Path(__file__).parent.parent  # Go up to populate_db directory
SAMPLE_FILES = {
    "bad_apple_jpg": SCRIPT_DIR / "sample_files" / "bad_apple.jpg",
    "good_apple_jpg": SCRIPT_DIR / "sample_files" / "good_apple.jpg",
    "random_pdf": SCRIPT_DIR / "sample_files" / "random_pdf.pdf",
}

# Population counts - hardcoded values
POPULATION_COUNTS = {
    "quotes": 250,  # Increased to accommodate 3 pending quotes per product (56*3=168) plus additional random quotes
    "product_records": 3000,  # Significantly increased to support better inventory distribution
    "orders": 8000,  # Reduced to preserve more InStock inventory
    "trips": 1210,  # Increased to provide ~6 trips per driver (70 drivers)
    "warehouse_transfers": 650,  # Increased to provide ~5 transfers per driver
}

# Target sizes for base entities - hardcoded values
USER_TARGETS = {
    "Administrator": 10,
    "Supplier": 25,
    "Buyer": 50,
    "TruckDriver": 25,
}

PRODUCT_TARGET_COUNT = 56
WAREHOUSE_TARGET_COUNT = 32
TRUCK_TARGET_COUNT = 60
