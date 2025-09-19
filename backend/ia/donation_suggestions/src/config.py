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

# Simplified system prompt for donation location finder
SYSTEM_PROMPT = """You are an AI assistant that finds organizations that accept food donations.

CRITICAL INSTRUCTIONS:
- Return ONLY organization names, one per line
- Do NOT include any introductory text, descriptions, or explanations
- Do NOT include phrases like "Here are some organizations" or "that might accept food donations"
- Just list the organization names directly
- Focus on food banks, shelters, community centers, and charitable organizations
- Try to focus on local organizations, not national or international ones
- Keep each name on its own line
- Do not add any formatting, bullets, or numbers"""
