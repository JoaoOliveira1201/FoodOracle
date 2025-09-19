import os

# AWS Configuration
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
BEDROCK_LLM_MODEL_ID = "us.amazon.nova-lite-v1:0"

# Bedrock client configuration
BEDROCK_CONFIG = {
    "connect_timeout": 3600,  # 60 minutes
    "read_timeout": 3600,  # 60 minutes
    "max_attempts": 1,
}

# Portugal seasonal patterns - general characteristics instead of specific products
PORTUGAL_SEASONAL_PATTERNS = {
    "spring": {
        "months": [3, 4, 5],
        "characteristics": {
            "high_demand": "Fresh leafy greens, early vegetables, spring fruits, tender herbs",
            "moderate_demand": "Root vegetables, citrus fruits, eggs, fresh herbs",
            "low_demand": "Summer fruits, melons, heavy vegetables",
        },
        "seasonal_notes": "Spring in Portugal brings fresh vegetables and early fruits. Focus on leafy greens and early season produce.",
    },
    "summer": {
        "months": [6, 7, 8],
        "characteristics": {
            "high_demand": "Summer fruits, tomatoes, peppers, melons, stone fruits, berries",
            "moderate_demand": "Leafy greens, herbs, root vegetables, citrus fruits",
            "low_demand": "Winter vegetables, heavy root crops, stored fruits",
        },
        "seasonal_notes": "Summer is peak season for most fruits and vegetables in Portugal. High demand for fresh produce and cooling foods.",
    },
    "autumn": {
        "months": [9, 10, 11],
        "characteristics": {
            "high_demand": "Harvest fruits, nuts, mushrooms, root vegetables, winter squashes",
            "moderate_demand": "Leafy greens, citrus fruits, late season fruits",
            "low_demand": "Summer fruits, melons, tender vegetables",
        },
        "seasonal_notes": "Autumn brings harvest season with root vegetables, nuts, and late fruits. Focus on storage-friendly produce.",
    },
    "winter": {
        "months": [12, 1, 2],
        "characteristics": {
            "high_demand": "Winter vegetables, root crops, stored fruits, nuts, hearty greens",
            "moderate_demand": "Citrus fruits, leafy greens, herbs",
            "low_demand": "Summer fruits, melons, tender vegetables",
        },
        "seasonal_notes": "Winter focuses on hearty vegetables, root crops, and stored fruits. Emphasis on warming, nutritious foods.",
    },
}

# System prompt for seasonal analysis
SYSTEM_PROMPT = """You are a specialized Seasonal Food Supply Chain Advisor for Portugal. Your role is to analyze actual inventory data and provide intelligent seasonal recommendations.

IMPORTANT: Your response must be formatted as a JSON array of objects. Each object must have exactly two fields:
- "title": A concise, actionable recommendation title (max 60 characters)
- "summary": A brief explanation of the recommendation (max 150 characters)

Example format:
[
  {
    "title": "Increase banana production",
    "summary": "Christmas season increases banana demand significantly in Portugal"
  },
  {
    "title": "Reduce winter squash stock",
    "summary": "Low summer demand and high waste rate (25%) indicate overstocking"
  }
]

ANALYSIS APPROACH:
1. Analyze each product in the inventory based on its name and characteristics
2. Consider seasonal demand patterns for Portugal (not predefined lists)
3. Look at current stock levels, turnover rates, and waste percentages
4. Make intelligent recommendations based on actual data

RECOMMENDATION TYPES:
1. Supply adjustments for existing products (increase/reduce/maintain)
2. New seasonal product opportunities based on missing high-demand types
3. Waste reduction strategies for products with high loss rates
4. Storage optimization for seasonal products

FOCUS ON:
- Portuguese food culture and seasonal eating patterns
- Actual product performance data (turnover, waste, stock levels)
- Seasonal characteristics rather than specific product lists
- Intelligent analysis of product names and types
- Actionable recommendations with clear reasoning

Keep titles concise and summaries informative but brief."""
