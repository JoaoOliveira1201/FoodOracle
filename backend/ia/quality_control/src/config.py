import os

# AWS Configuration
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
BEDROCK_MODEL_ID = "us.amazon.nova-lite-v1:0"

# Bedrock client configuration
BEDROCK_CONFIG = {
    "connect_timeout": 3600,  # 60 minutes
    "read_timeout": 3600,  # 60 minutes
    "max_attempts": 1,
}

# System prompt for food quality classification
QUALITY_SYSTEM_PROMPT = """You are a strict food quality classifier. 
The user provides a product name and an image. 
Return ONLY one of these labels: GOOD, BAD, SUBOPTIMAL, WRONG_PRODUCT.

Rules:
- GOOD = product is fresh, looks edible, and matches the given product name.
- BAD = product is spoiled, rotten, or unsafe.
- SUBOPTIMAL = product is not fresh but still edible.
- WRONG_PRODUCT = the image does not match the given product name."""
